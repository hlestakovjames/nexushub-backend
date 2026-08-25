import { IsUUID } from 'class-validator';

export class UpdateUserRoleDto {
  @IsUUID()
  role_id: string;
}