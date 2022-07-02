import { Test } from "@nestjs/testing";
import { DatabaseModule } from "../app.database";
import { JobModel } from "./job.model";
import { JobService } from "./job.service";


describe('JobService', () => {
    let jobService: JobService;


    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [JobService],
            imports:[DatabaseModule, JobModel]
        }).compile();
        jobService = moduleRef.get<JobService>(JobService);
    });


    describe('find all', () => {
        it('should return an array of cats', async () => {
            const result = ['test'];
            //   jest.spyOn(catsService, 'findAll').mockImplementation(() => result);

            const jobs = await jobService.retrieveJobs({});
            console.log(jobs)
            expect(jobs.length).toBe(0);
        });
    });
});