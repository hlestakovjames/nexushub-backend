import {
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateMembershipDto {
  @IsUUID()
  organization_id: string;

  @IsOptional()
  @IsUUID()
  department_id?: string;

  @IsOptional()
  @IsUUID()
  role_id?: string;
}