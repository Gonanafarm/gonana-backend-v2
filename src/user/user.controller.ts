import {
  Controller,
  Get,
  Post,
  Req,
  Param,
  UseGuards,
  Body,
  Put,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from './user.schema';
import { UpdateUserDto } from './user.dto';

@ApiTags('user-controller')
@ApiBearerAuth()
@Controller('api/user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Put('/:item')
  @ApiResponse({ type: User })
  updateUser(
    @Req() req: Request,
    @Body() body: UpdateUserDto,
    @Param('item') item: string,
  ) {
    return this.userService.updateItem(item, body);
  }
  
  @Post('/find-by-email/:email')
  @ApiResponse({ type: User })
  findAccountByEmail(@Req() req: Request, @Param('email') email: string) {
    return this.userService.findByEmail(email);
  }

  @Post('/find-by-id/:id')
  @ApiResponse({ type: User })
  findAccountById(@Req() req: Request, @Param('id') id: string) {
    return this.userService.findById(id);
  }


}
