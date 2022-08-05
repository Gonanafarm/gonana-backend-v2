import { Test } from "@nestjs/testing";
import { DatabaseModule } from "../app.database";
import { TaxonomyModel } from "./taxonomy.model";
import { TaxonomyService } from "./taxonomy.service";

describe('ProductService', () => {
    let taxonomyService: TaxonomyService;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [TaxonomyService],
            imports: [DatabaseModule, TaxonomyModel]
        }).compile();
        taxonomyService = moduleRef.get<TaxonomyService>(TaxonomyService);
    });

    describe('find all', () => {
        it('should return an array of cats', async () => {
            const result = ['test'];
            //   jest.spyOn(catsService, 'findAll').mockImplementation(() => result);

            const products = await taxonomyService.retrieveItems()
            console.log(products)
            expect(products.length).toBe(0);
        });
    });
});