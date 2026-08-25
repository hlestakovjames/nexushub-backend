import { IsBoolean } from 'class-validator';

export class UpdateOrganizationStatusDto {
  @IsBoolean()
  is_active: boolean;
}