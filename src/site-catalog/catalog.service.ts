import { Injectable } from "@nestjs/common";
import { TaxonomyService } from "../taxonomy/taxonomy.service";
import { EventService } from "../events/events.service";
import { OrganizationService } from "../organisation/organisation.service";
import { PostService } from "../post/post.service";
import { ProductService } from "../product/product.service";

@Injectable()
class SiteCatalogService {
    constructor(private readonly taxonomyService: TaxonomyService,
        private readonly postService: PostService,
        private readonly productService: ProductService,
        private readonly orgService: OrganizationService,
        private readonly eventService: EventService,
    ) {



    }

    // retrieveOrganizationHomeData(domain: string) {

    // }

    // retrieveOrganizationBlogData() {

    // }

    // retrieveOrganizationMediaData() {

    // }



    // retrieveOrganizationPostEntryData() {

    // }


}