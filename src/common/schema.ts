import { Prop } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import * as mongoose from "mongoose";


export class Address {
    @ApiProperty()
    @Prop({ type: mongoose.SchemaTypes.String })
    address: string;
    @ApiProperty()
    @Prop({ type: mongoose.SchemaTypes.String })
    city: string;
    @ApiProperty()
    @Prop({ type: mongoose.SchemaTypes.String })
    state: string;
    @ApiProperty()
    @Prop({ type: mongoose.SchemaTypes.String })
    country: string;
    @ApiProperty()
    @Prop({ type: mongoose.SchemaTypes.String })
    country_code: string;
    @ApiProperty()
    @Prop({ type: mongoose.SchemaTypes.String })
    country_name: string;
    @ApiProperty()
    @Prop({ type: mongoose.SchemaTypes.Number })
    zip: string;

}

export class GeoJson {
    @ApiProperty()
    @Prop({ type: mongoose.SchemaTypes.Number })
    latitude: number;
    @ApiProperty()
    @Prop({ type: mongoose.SchemaTypes.Number })
    longitude: number;
}