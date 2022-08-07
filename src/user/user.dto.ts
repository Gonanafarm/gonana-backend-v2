import { ApiProperty } from "@nestjs/swagger";

export class UserPublicData {
    @ApiProperty({})
    id: string;
    @ApiProperty({})
    email: string;
    @ApiProperty({})
    isActive: boolean;
    @ApiProperty({})
    paystack_int: any;
    @ApiProperty({})
    subscription_plan:string;
    @ApiProperty({})
    subscription_status: string;
    @ApiProperty({})
    subscription_transaction: any;
  }
  