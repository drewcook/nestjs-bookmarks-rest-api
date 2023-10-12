import {
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class EditBookmarkDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsUrl()
  @IsOptional()
  link?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
