import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDate, IsObject, Validate, IsDateString } from 'class-validator';
import { IAddress, IPerson } from '../common/interface';

export class PublishJobDto {
    @IsString()
    @IsNotEmpty()
    type: string;
    @IsString()
    @IsNotEmpty()
    agent_id: string;

    @IsString()
    @IsNotEmpty()
    initiator_id: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    receipient_id?: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    order_id: string;

    @ApiProperty()
    @IsNotEmpty()
    deliver_to_address: IAddress;

    @ApiProperty()
    @IsNotEmpty()
    deliver_to: IPerson;

    @ApiProperty()
    @IsDateString()
    @IsNotEmpty()
    delivery_time: Date;

    @ApiProperty()
    @IsObject()
    @IsNotEmpty()
    pickup_from_address: IAddress;

    @ApiProperty()
    @IsDateString()
    @IsNotEmpty()
    pickup_time: Date;
}


export class JobQueryDto {
    @IsString()
    agent_id?: string;
    @IsString()
    agent_status?: string;
    @IsString()
    id?: string;
    @IsString()
    initiator_id?: string;
    @IsString()
    initiator_status?: string;
    @IsString()
    receipient_id?: string;
    @IsString()
    receipient_status?: string;
    @IsString()
    type?: string;
}

export class UpdateJobAgent {
    @ApiProperty()
    @IsString({})
    @IsNotEmpty()
    agent_id?: string;
}