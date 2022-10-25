import { Request } from "express";
import admin from "firebase-admin";
import {Bucket} from "@google-cloud/storage";

export interface IFirebase {
    bucket: Bucket,
    firebase: admin.app.App,
}

export interface IRequest extends  Request {
    file: IFile;
    files: IFile[];
}

export interface IFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    buffer: any;
    size: number;
}

// Query
export interface IQueryParams {
    search?: string;
    sort?: string;
    columns?: string;
    offset?: number;
    limit?: number;
}
export interface ICondition {
    search?: string;
}

// User
export interface IUser {
    email?: string;
    full_name?: string,
    birthday?: number,
    gender?: number,
    phone_number?: string,
    address?: string,
    class_id?: number,
    course_id?:  number,
    created_by?: number,
    created_at?: string,
    updated_by?: number,
    updated_at?: string,
    status?: number,
}

export interface IUserQueryParams extends IQueryParams, IUser {
}

// JWT
export interface ITokenPayload {
    fullName?: string;
    username?: string;
    email?: string;
    classId?: string;
    courseId?: string;
    role?: number;
}

export interface IAccount {
    accountVerified?: boolean,
    email: string,
    hash: string,
    status?: number,
    role?: number
    registerTypeId?: number,
}

export interface IMesasgeCondition {
    search?: string;
}

export interface IMessageQueryParams {
    start_read_message?: number;
    limit?: number;
    user_id: number;
    room_id: number;

    search?: string;
}