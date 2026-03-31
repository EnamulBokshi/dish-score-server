import catchAsync from "../../helpers/catchAsync";
import { sendResponse } from "../../helpers/sendResponse";
import { SearchService } from "./search.service";
const globalSearch = catchAsync(async (req, res) => {
    const result = await SearchService.getGlobalSearchResults(req.query);
    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result,
        message: "Global search results retrieved successfully",
    });
});
export const SearchController = {
    globalSearch,
};
