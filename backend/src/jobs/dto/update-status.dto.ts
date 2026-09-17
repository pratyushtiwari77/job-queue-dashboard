import { IsEnum } from 'class-validator';
import { JobStatus } from '../job-status.enum';

export class UpdateStatusDto {
  @IsEnum(JobStatus, { message: 'status must be one of pending, running, completed, failed' })
  status: JobStatus;
}
