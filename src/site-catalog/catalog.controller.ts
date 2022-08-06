import { Body, CacheInterceptor, CACHE_MANAGER, Controller, Delete, Get, Headers, Inject, Module, Param, Post, Put, Query, Req, UseGuards, UseInterceptors } from "@nestjs/common";
import { Cache } from "cache-manager"
import { ApiTags, ApiResponse, ApiBearerAuth, ApiHeader } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { TaxonomyService } from "../taxonomy/taxonomy.service";
import { PostService } from "../post/post.service";
import { ProductService } from "../product/product.service";
import { OrganizationService } from "../organisation/organisation.service";
import { EventService } from "../events/events.service";
import { ResourceNotFoundException } from "../common/exceptions";
import { Organization } from "../organisation/organisation.schema";
import { domain } from "process";
import { TOrgAboutData, TOrgBlogData, TOrgHomeData, TOrgMediaData, TOrgPostData } from "./catalog.interface";

@UseInterceptors(CacheInterceptor)
@ApiTags("public")
@Controller("/public/site/")
export class SiteController {

  constructor(private readonly taxonomyService: TaxonomyService,
    private readonly postService: PostService,
    private readonly orgService: OrganizationService,
    private readonly eventService: EventService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) { }

  @Get(":org_domain/media")
  @ApiResponse({ status: 200, description: 'Returns item by id', isArray: false, type: TOrgMediaData })
  async getStoreMediaData(@Param("org_domain") org_domain: string) {
    let response = await this.getDomainResource(org_domain);

    if (!response) return;

    let posts = await this.postService.retrieveItems({ publisher_id: response?.publisher_id });
    let taxonomies = await this.taxonomyService.retrieveItems({ publisher_id: response?.publisher_id });


    let data: TOrgMediaData = {
      org: response,
      sermons: posts.filter(element => element.type == "sermon"),
      taxonomies: taxonomies
    }

    return data;
  }

  @Get(":org_domain/blog")
  @ApiResponse({ status: 200, description: 'Returns item by id', isArray: false, type: TOrgBlogData })
  async getStoreBlogData(@Param("org_domain") org_domain: string) {
    let response = await this.getDomainResource(org_domain);

    if (!response) return;

    let posts = await this.postService.retrieveItems({ publisher_id: response?.publisher_id });
    let taxonomies = await this.taxonomyService.retrieveItems({ publisher_id: response?.publisher_id });


    let data: TOrgBlogData = {
      org: response,
      posts: posts.filter(element => element.type == "article"),
      taxonomies: taxonomies
    }

    return data;
  }

  @Get(":org_domain/post/:item")
  @ApiResponse({ status: 200, description: 'Returns item by id', isArray: false, type: TOrgPostData })
  async getStorePostEntryData(@Param("item") item: string, @Param("org_domain") org_domain: string) {
    let response = await this.getDomainResource(org_domain);

    if (!response) return;

    let taxonomies = await this.taxonomyService.retrieveItems({ publisher_id: response?.publisher_id });

    let data: TOrgPostData = {
      org: response,
      taxonomies: taxonomies,
      post: await this.postService.getItem(item)
    }

    return data;
  }


  @Get(":org_domain/home")
  @ApiResponse({ status: 200, description: 'Returns item by id', isArray: false, type: TOrgHomeData })
  async getStoreHomeData(@Param("org_domain") org_domain: string) {
    let response = await this.getDomainResource(org_domain);

    if (!response) return;

    let posts = await this.postService.retrieveItems({ publisher_id: response?.publisher_id });
    let taxonomies = await this.taxonomyService.retrieveItems({ publisher_id: response?.publisher_id });


    let data: TOrgHomeData = {
      org: response,
      posts: posts.filter(element => element.type == "article").slice(0, 12),
      sermons: posts.filter(element => element.type == "sermon").slice(0, 12),
      taxonomies: taxonomies
    }

    return data;
  }

  @Get(":org_domain/about")
  @ApiResponse({ status: 200, description: 'Returns item by id', isArray: false, type: TOrgAboutData })
  async getStoreAboutData(@Param("org_domain") org_domain: string) {
    let response = await this.getDomainResource(org_domain);
    if (!response) return;
    let taxonomies = await this.taxonomyService.retrieveItems({ publisher_id: response?.publisher_id });

    let data: TOrgAboutData = {
      org: response,
      taxonomies: taxonomies
    }

    return data;
  }




  async getDomainResource(domain_name: string): Promise<Organization | undefined> {
    const value = await this.cacheManager.get<Organization>(domain_name);
    if (value) {
      return value;
    } else {
      let response = await this.orgService.dataModel.findOne({ preferred_domain: domain_name });
      if (response) {
        await this.cacheManager.set(domain_name, response.toObject());
        return await this.cacheManager.get<Organization>(domain_name);
      } else {
        throw ResourceNotFoundException();
      }
    }
  }


}
