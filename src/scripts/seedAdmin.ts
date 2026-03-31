// seed Super admin into the database

import { auth } from "../app/lib/auth";
import prisma from "../app/lib/prisma"
import { env } from "../config/env"
import { AdminRole, UserRole } from "../generated/prisma/enums";


const seedSuperAdmin = async()=> {
    
    console.log("******************")
    console.log("Seeding Super Admin into the database begun...")

    console.log("Checking if Super Admin already exists...")

    const exSuperAdmin = await prisma.user.findUnique({
        where: {
            email: env.SUPER_ADMIN_EMAIL
        }
    })
    if(exSuperAdmin) {
        console.log("Super Admin already exists. Skipping seeding.");
        console.log("******************")
        return;
    }
    console.log("Super Admin does not exist. Proceeding with seeding.")

    const superAdminData = {
        name: env.SUPER_ADMIN_NAME,
        email: env.SUPER_ADMIN_EMAIL,
        password: env.SUPER_ADMIN_PASSWORD,
        phone: env.SUPER_ADMIN_PHONE,
        profilePhotoUrl: env.SUPER_ADMIN_PROFILE_PHOTO_URL
    }
    const user = await auth.api.signUpEmail({
        body: {
            name: superAdminData.name,
            email: superAdminData.email,
            password: superAdminData.password,
            role: UserRole.SUPER_ADMIN,
            image: superAdminData.profilePhotoUrl,
            rememberMe: false,
        }

    })
    if(!user.user) {
        console.error("Failed to create super admin user");
        console.log("******************")
        return;
    }
    console.log("Super Admin user created successfully. Creating super admin profile...")

    
    try {
          await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: {
                    id: user.user.id
                },
                data: {
                    emailVerified: true,
                },
            
            });

            await tx.admin.create({
                data: {
                    userId: user.user.id,
                    name: superAdminData.name,
                    email: superAdminData.email,
                    contactNumber: superAdminData.phone,
                    profilePhoto: superAdminData.profilePhotoUrl,
                    role: AdminRole.SUPER_ADMIN
                }
            })



         }, {
            timeout: 10000,
            maxWait: 10000,
         });


      
        console.log("Super Admin profile created successfully.");
        console.log("******************")
    }
    catch (error: unknown) {
        console.error("Error creating super admin profile:", error);
        // rollback -delete the user created for super admin
        await prisma.user.delete({
            where: {
                id: user.user.id
            }
        })
        console.error("Failed to create super admin profile. Rolled back user creation.");
        console.log("******************")
    }
    finally {
        console.log("Seeding Super Admin into the database completed.")
        console.log("******************")
        prisma.$disconnect();
    }

}

seedSuperAdmin();

export default seedSuperAdmin;

