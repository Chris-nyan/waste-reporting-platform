
# Waste Reporting Platform

This repository contains the **Waste Reporting Platform** with two portals:

1. **Tenant Portal** – for tenants to log and manage waste data.  
2. **Super Admin Portal** – for administrators to manage all tenants and reporting.

The repository includes **client** and **server** folders for the frontend and backend.

---

## **1. Prerequisites**

- [Node.js via NVM](https://github.com/nvm-sh/nvm) (v20.x)  
- npm (comes with Node.js)  
- Git

---

## **2. Setup Instructions**

### **Clone Repository**

```bash
git clone <repository-url>
cd <repository-folder>

Install Node Version

nvm install 20
nvm use 20

Install Dependencies

Server

cd server
npm install

Client

cd client
npm install

---


## **3. Branching Strategy**


We follow a Git workflow with separate development branches for each portal:
	•	develop-tenant: Development branch for the Tenant Portal.
	•	develop-superadmin: Development branch for the Super Admin Portal.
	•	staging: Pre-production branch for QA and testing.
	•	master: Production-ready branch. Only tested and approved code is merged here.

Creating a feature branch for Tenant Portal:

git checkout develop-tenant
git pull origin develop-tenant
git checkout -b feature/<your-feature-name>

Creating a feature branch for Super Admin Portal:

git checkout develop-superadmin
git pull origin develop-superadmin
git checkout -b feature/<your-feature-name>

Workflow:
	1.	Start from the correct develop branch (develop-tenant or develop-superadmin).
	2.	Create a feature branch for your work.
	3.	Commit changes and push the branch.
	4.	Open a Pull Request (PR) to merge into the respective develop branch.
	5.	After testing, merge into staging.
	6.	After QA on staging, merge into master.

---

## **4. Running the Project Locally**

You need two separate terminals for client and server.

Server

cd server
npm run dev

Default port: http://localhost:3002 (adjust .env if needed for testing purpose only)

Client

cd client
npm run dev

Default port: http://localhost:5173 (adjust .env if needed for testing purpose only)

---

## **5. Environment Variables**

Create a .env file in both server and client folders based on .env.example. Example for server:

PORT=3002
DATABASE_URL=<your-database-url>
JWT_SECRET=<your-jwt-secret>
AWS_ACCESS_KEY_ID=<your-aws-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret>
AWS_REGION=<your-aws-region>
AWS_S3_BUCKET_NAME=<your-bucket-name>

For client:

VITE_API_URL=http://localhost:3002


---

## **6. Notes for Developers**
	•	Always check your branch before starting work to avoid conflicts.
	•	Use separate feature branches for each task.
	•	Client and server run independently; you need both running to test the full platform.
	•	Uploads: Local storage by default, optional S3 integration is available.
	•	Multiple images are supported for waste reporting.

---

## **7. Useful Commands**

Command	Description
npm run dev	Start development server (for both client and server separately)
npm install	Install dependencies
nvm install 20	Install Node.js v20
git checkout <branch>	Switch branch
git pull origin <branch>	Pull latest changes


---

## **8. Getting Help**
	•	For backend issues: check server/controllers and server/routes.
	•	For frontend issues: check client/src/components and client/src/lib/api.js.
	•	Logging and debugging: use console.log or browser dev tools for client, console.error for server.

⸻

Happy coding! 🚀

This README covers:  
- nvm 20  
- separate terminals for client/server  
- multi-develop branches (`develop-tenant` & `develop-superadmin`)  
- workflow instructions  

---
