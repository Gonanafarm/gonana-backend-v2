import {Body, Controller, Get, Post, Query, Req, UseGuards} from "@nestjs/common";
import {OrderService} from "../order/order.service";
import {UserService} from "../user/user.service";
import {PostService} from "../post/post.service";
import {TaxonomyService} from "../taxonomy/taxonomy.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";

@Controller("user-catalog")
@ApiTags("user-catalog")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class PublicController {
  constructor(
    private readonly userService: UserService,
    private readonly orderService: OrderService,
    private readonly postService: PostService,
    private readonly taxonomyService: TaxonomyService,
  ) {}

  @Get("/search")
  searchFeed(@Body() body: any, @Query("query") query: string) {
    return this.postService.dataModel.find({$text: {$search: query}});
  }

  @Get("/feed")
  async getHomeFeed(@Body() body: any) {
    let taxonomies = await this.taxonomyService.retrieveItems({});
    let posts = await this.postService.retrieveItems({type: "post"});
    let products = await this.postService.retrieveItems({type: "product"});

    return {
      taxonomies,
      posts,
      products,
    };
  }

  @Get("/feedby-geo")
  async getFeedByGeo(
    @Body() body: any,
    @Query("lat") lat: number,
    @Query("long") long: number,
  ) {
    let posts = await this.postService.dataModel.aggregate([
      {
        $geoNear: {
          near: {type: "Point", coordinates: [lat, long]},
          distanceField: "dist.calculated",
          maxDistance: 2,
          includeLocs: "dist.location",
          spherical: true,
        },
      },
    ]);

    return {
      posts,
    };
  }

  @Get("/marketplace-feed")
  async getMarketPlaceFeed(@Body() body: any) {
    let taxonomies = await this.taxonomyService.retrieveItems({});
    let products = await this.postService.retrieveItems({type: "product"});

    return {
      taxonomies,
      products,
    };
  }

  @Get("/social-feed")
  async getSocialFeed(@Body() body: any) {
    let taxonomies = await this.taxonomyService.retrieveItems({});
    let posts = await this.postService.retrieveItems({type: "post"});

    return {
      taxonomies,
      posts,
    };
  }

  @Get("/user-orders")
  async getUserOrders(@Body() body: any, @Req() req: any) {
    let publisher_id = "";
    //@ts-ignore
    publisher_id = req.user?.sub ?? "";

    let orders = await this.orderService.retrieveItems({
      customer: publisher_id,
    });

    return {
      orders,
    };
  }

  @Get("/farmer-orders")
  async getFarmerOrders(@Body() body: any, @Req() req: any) {
    let publisher_id = "";
    //@ts-ignore
    publisher_id = req.user?.sub ?? "";

    let orders = await this.orderService.retrieveItems({
      farmer_id: publisher_id,
    });

    return {
      orders,
    };
  }

  @Get("/farmer-posts")
  async getFarmerPosts(@Body() body: any, @Req() req: any) {
    let publisher_id = "";
    //@ts-ignore
    publisher_id = req.user?.sub ?? "";

    let posts = await this.postService.retrieveItems({
      publisher_id: publisher_id,
    });

    return {posts};
  }
}
