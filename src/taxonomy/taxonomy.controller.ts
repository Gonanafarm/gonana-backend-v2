import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Schema } from '@nestjs/mongoose';
import { ApiTags, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PublishTaxonomyDto, UpdateTaxonomyDto } from './taxonomy.dto';
import { Taxonomy } from './taxonomy.schema';
import { TaxonomyService } from './taxonomy.service';
import { Request } from 'express';

@ApiTags('taxonomy-controller')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/catalog/taxonomy')
export class TaxonomyController {
  constructor(private readonly TaxonomyService: TaxonomyService) {}

  @Get('')
  @ApiResponse({
    status: 200,
    description: 'Returns list of store Taxonomys',
    isArray: true,
    type: Taxonomy,
  })
  get(
    @Req() req: Request,
  ) {
    return this.TaxonomyService.retrieveItems({});
  }

  @Post('')
  @ApiResponse({
    status: 200,
    description: 'Create record successfully',
    isArray: false,
    type: Taxonomy,
  })
  async publish(@Body() body: PublishTaxonomyDto, @Req() req: Request) {
    let publisher_id = '';
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    publisher_id = req.user?.sub ?? '';
    return await this.TaxonomyService.create(publisher_id, body);
  }

  @Delete(':item')
  async deleteItem(@Param('item') item: string): Promise<any> {
    return this.TaxonomyService.deleteItem(item);
  }

  @Get(':item')
  @ApiResponse({
    status: 200,
    description: 'Returns item by id',
    isArray: false,
    type: Taxonomy,
  })
  async getById(@Param('item') item: string) {
    return await this.TaxonomyService.getItem(item);
  }

  @Put(':item')
  @ApiResponse({
    status: 200,
    description: 'Updates item record',
    isArray: false,
    type: Taxonomy,
  })
  async update(@Param('item') item: string, @Body() body: UpdateTaxonomyDto) {
    return await this.TaxonomyService.updateItem(item, body);
  }
}
