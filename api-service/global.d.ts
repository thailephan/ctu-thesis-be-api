// declare module 'express' {
//     export interface Request {
//         user: any;
//     }
// }

declare namespace Express {
    export interface Request {
        metadata?: {
            ua?: string;
            ip?: string;
            flowId?: string;
            user?: any;
        }
    }
}