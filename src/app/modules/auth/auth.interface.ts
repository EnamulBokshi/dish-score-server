export interface RegisterUserPayload {
name: string;
email: string;
password: string;
}


export interface IChangePasswordPayload {
    currentPassword: string;
    newPassword: string;
}