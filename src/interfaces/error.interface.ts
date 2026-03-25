export interface IErrorSource  {
  path: string;
  message: string;
}


export interface IErrorResponse {
    statusCode: number;
    success: boolean;
    message: string;
    errorSources: IErrorSource[];
    stack?: string;
    error?: unknown;

}




export interface TErrorSources  {
  path: string;
  message: string;
}


export interface TErrorResponse {
    statusCode: number;
    success: boolean;
    message: string;
    errorSources: TErrorSources[];
    stack?: string;
    error?: unknown;

}

