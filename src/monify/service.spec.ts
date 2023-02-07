import {Test} from "@nestjs/testing";
import {MonifyService} from "./service";

describe("MonifyService", () => {
  let monifyService: MonifyService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [MonifyService],
    }).compile();

    monifyService = moduleRef.get<MonifyService>(MonifyService);
  });

  describe("reserve account", () => {
    it("should return an account object", async () => {
      const result = ["test"];
      let newAccount = await monifyService.reserveAccount({
        accountName: "John Snow Limited",
        accountReference: "jsnow1234",
        currencyCode: "NGN",
        contractCode: "4197962802",
        customerName: "John Snow Limited",
        customerEmail: "john@snow.com",
        incomeSplitConfig: [],
      });

      expect(newAccount.customerEmail).toBe("john@snow.com");
    });
  });
});
