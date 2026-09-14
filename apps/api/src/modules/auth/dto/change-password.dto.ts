import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

/** تغییر رمز توسط خود کاربر. */
export class ChangePasswordDto {
  @ApiProperty({ description: 'رمز فعلی — برای تأیید هویت' })
  @IsString({ message: 'رمز فعلی الزامی است.' })
  @MaxLength(200)
  currentPassword!: string;

  /** همان قواعد رمز کاربران: حداقل ۸ نویسه، شامل حرف و رقم. */
  @ApiProperty({ description: 'رمز تازه' })
  @IsString({ message: 'رمز تازه الزامی است.' })
  @MinLength(8, { message: 'رمز عبور حداقل ۸ کاراکتر است.' })
  @MaxLength(200)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'رمز عبور باید حداقل شامل یک حرف و یک رقم باشد.',
  })
  newPassword!: string;
}
