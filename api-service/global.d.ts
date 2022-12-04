// declare module 'express' {
//     export interface Request {
//         user: any;
//     }
// }

declare namespace Express {
    export interface Request {
        flowId?: string;
        user?: any;
    }
}