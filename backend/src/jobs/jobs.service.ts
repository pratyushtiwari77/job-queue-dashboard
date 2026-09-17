import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import db from '../db';
import { JobStatus } from './job-status.enum';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateStatusDto } from './dto/update-status.dto';


const ALLOWED_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  [JobStatus.PENDING]: [JobStatus.RUNNING],
  [JobStatus.RUNNING]: [JobStatus.COMPLETED, JobStatus.FAILED],
  [JobStatus.COMPLETED]: [],
  [JobStatus.FAILED]: [],
};

@Injectable()
export class JobsService {
  create(dto: CreateJobDto) {
    const id = randomUUID();
    const createdAt = new Date().toISOString();

    db.prepare(
      'INSERT INTO jobs (id, title, type, status, createdAt) VALUES (?, ?, ?, ?, ?)',
    ).run(id, dto.title, dto.type, JobStatus.PENDING, createdAt);

    return this.findOne(id);
  }

  findAll(status?: string) {
    if (status) {
      if (!Object.values(JobStatus).includes(status as JobStatus)) {
        throw new BadRequestException('Invalid status filter');
      }
      return db
        .prepare('SELECT * FROM jobs WHERE status = ? ORDER BY createdAt DESC')
        .all(status);
    }
    return db.prepare('SELECT * FROM jobs ORDER BY createdAt DESC').all();
  }

  findOne(id: string) {
    return db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);
  }

  updateStatus(id: string, dto: UpdateStatusDto) {
    const job: any = this.findOne(id);
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const allowedNext = ALLOWED_TRANSITIONS[job.status as JobStatus];
    if (!allowedNext || !allowedNext.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot change status from "${job.status}" to "${dto.status}"`,
      );
    }
    const result = db
      .prepare('UPDATE jobs SET status = ? WHERE id = ? AND status = ?')
      .run(dto.status, id, job.status);

    if (result.changes === 0) {
      throw new ConflictException(
        'This job was already updated by someone else. Please refresh and try again.',
      );
    }

    db.prepare(
      'INSERT INTO job_status_history (id, jobId, fromStatus, toStatus, changedAt) VALUES (?, ?, ?, ?, ?)',
    ).run(randomUUID(), id, job.status, dto.status, new Date().toISOString());

    return this.findOne(id);
  }

  remove(id: string) {
    const result = db.prepare('DELETE FROM jobs WHERE id = ?').run(id);
    if (result.changes === 0) {
      throw new NotFoundException('Job not found');
    }
    return { deleted: true };
  }

  getHistory(id: string) {
    return db
      .prepare('SELECT * FROM job_status_history WHERE jobId = ? ORDER BY changedAt ASC')
      .all(id);
  }
}
