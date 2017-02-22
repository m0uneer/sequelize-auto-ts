////////////////////////////////////////////////////////////////////
//
// GENERATED CLASS
//
// DO NOT EDIT
//
// See sequelize-auto-ts for edits
//
////////////////////////////////////////////////////////////////////

import sequelize from 'sequelize';

export interface RoleID { RoleID:number; }
export interface UserID { UserID:number; }

export interface RolePojo
{
    RoleID?:number;
    RoleName?:string;
    users?:UserPojo[];
}

export interface RoleInstance extends sequelize.Instance<RoleInstance, RolePojo>, RolePojo { }

export interface RolesModel extends sequelize.Model<RoleInstance, RolePojo> {
    getRole:(role:RolePojo) => sequelize.PromiseT<RoleInstance>;
}

export interface UserPojo
{
    UserID?:number;
    RoleID?:number;
    UserName?:string;
    role?:RolePojo;
}

export interface UserInstance extends sequelize.Instance<UserInstance, UserPojo>, UserPojo { }

export interface UsersModel extends sequelize.Model<UserInstance, UserPojo> {
    getUser:(user:UserPojo) => sequelize.PromiseT<UserInstance>;
}

