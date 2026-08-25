import { IsIn } from 'class-validator';

export class UpdateMembershipStatusDto {
  @IsIn([
    'active',
    'inactive',
    'suspended',
    'left',
  ])
  status: string;
}