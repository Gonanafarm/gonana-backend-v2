import { Test } from "@nestjs/testing";
import { DatabaseModule } from "../app.database";
import { ProductModel } from "./product.model";
import { ProductService } from "./product.service";

describe('ProductService', () => {
    let productService: ProductService;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [ProductService],
            imports: [DatabaseModule, ProductModel]
        }).compile();
        productService = moduleRef.get<ProductService>(ProductService);
    });

    describe('find all', () => {
        it('should return an array of cats', async () => {
            const result = ['test'];
            //   jest.spyOn(catsService, 'findAll').mockImplementation(() => result);

            const products = await productService.retrieveItems({})
            console.log(products)
            expect(products.length).toBe(0);
        });
    });
});