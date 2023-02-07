import { ApiProperty } from "@nestjs/swagger";
import { Organization } from "../organisation/organisation.schema";
import { Post } from "../post/post.schema";

export class TOrgHomeData {
    @ApiProperty({})
    org: Organization;
    @ApiProperty({ isArray: true, type: Post })
    posts: Post[];
    @ApiProperty({ isArray: true, type: Post })
    sermons: Post[];
    @ApiProperty({ isArray: true})
    taxonomies: any[];
}

export class TOrgAboutData {
    @ApiProperty({})
    org: Organization;
    @ApiProperty({ isArray: true })
    taxonomies: any[];
}

export class TOrgBlogData {
    @ApiProperty({})
    org: Organization;
    @ApiProperty({ isArray: true, type: Post })
    posts: Post[];
    @ApiProperty({ isArray: true})
    taxonomies: any[];
}

export class TOrgMediaData {
    @ApiProperty({})
    org: Organization;
    @ApiProperty({ isArray: true, type: Post })
    sermons: Post[];
    @ApiProperty({ isArray: true })
    taxonomies: any[];
}

export class TOrgPostData {
    @ApiProperty({})
    org: Organization;
    @ApiProperty({})
    post: Post;
    @ApiProperty({ isArray: true })
    taxonomies:any[];
}