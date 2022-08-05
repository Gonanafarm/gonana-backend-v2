import { Body, CacheInterceptor, Controller, Delete, Get, Headers, Inject, Module, Param, Post, Put, Query, Req, UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiTags, ApiResponse, ApiBearerAuth, ApiHeader } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { TaxonomyService } from "../taxonomy/taxonomy.service";
import { PostService } from "../post/post.service";
import { ProductService } from "../product/product.service";
import { OrganizationService } from "../organisation/organisation.service";
import { EventService } from "../events/events.service";

@UseInterceptors(CacheInterceptor)
@ApiTags("public")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("public/")
export class SiteController {

  constructor(private readonly taxonomyService: TaxonomyService,
    private readonly postService: PostService,
    private readonly productService: ProductService,
    private readonly orgService: OrganizationService,
    private readonly eventService: EventService,
  ) { }

  @Get(":store_domain/media")
  @ApiResponse({ status: 200, description: 'Returns item by id', isArray: false, type: Event })
  async getStoreMediaData(@Param("item") item: string) {
    return await this.taxonomyService.getItem(item);
  }

  @Get(":store_domain/blog")
  @ApiResponse({ status: 200, description: 'Returns item by id', isArray: false, type: Event })
  async getStoreBlogData(@Param("item") item: string) {
    return await this.taxonomyService.getItem(item);
  }

  @Get(":store_domain/blog/:item")
  @ApiResponse({ status: 200, description: 'Returns item by id', isArray: false, type: Event })
  async getStorePostEntryData(@Param("item") item: string) {
    return await this.taxonomyService.getItem(item);
  }


  @Get(":store_domain/home")
  @ApiResponse({ status: 200, description: 'Returns item by id', isArray: false, type: Event })
  async getStoreHomeData(@Param("item") item: string) {
    return await this.taxonomyService.getItem(item);
  }

  @Get(":store_domain/about")
  @ApiResponse({ status: 200, description: 'Returns item by id', isArray: false, type: Event })
  async getStoreAboutData(@Param("item") item: string) {
    return await this.taxonomyService.getItem(item);
  }

}
