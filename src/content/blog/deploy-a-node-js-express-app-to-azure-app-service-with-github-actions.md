```yaml
---
title: "Deploy a Modern Node.js Express App to Azure App Service with GitHub Actions"
description: "Learn how to deploy a Node.js 22 Express app to Azure App Service with a CI/CD pipeline using GitHub Actions. Includes managed identity and Application Insights integration."
pubDate: "2026-03-22"
heroImage: "/images/blog/nodejs-express-azure-deploy-hero.png"
tags: ["Azure App Service", "Node.js", "Express", "GitHub Actions", "CI/CD", "Application Insights"]
category: "Tutorial"
author: "Jordan Selig"
---
```

# Deploy a Modern Node.js Express App to Azure App Service with GitHub Actions

Deploying a Node.js app to the cloud doesn’t have to be complicated. If you’ve been wondering how to take your Express app from localhost to production on Azure, this guide is for you. I’ll walk you through setting up a CI/CD pipeline with GitHub Actions, deploying to Azure App Service, and adding managed identity for secure access alongside Application Insights for monitoring. By the end, you’ll have a solid foundation for cloud deployments.

Let’s dive in.

---

## Architecture Overview

Before we start, here’s a bird’s-eye view of what we’re building:

```mermaid
graph LR
    A[GitHub Repository] -->|Push Code| B[GitHub Actions Workflow]
    B -->|Deploy| C[Azure App Service]
    C -->|Secure Access| D[Azure Resource (e.g., Key Vault)]
    C -->|Telemetry| E[Application Insights]
```

- **GitHub Repository:** Hosts your Node.js project and CI/CD workflow.
- **GitHub Actions Workflow:** Automates deployment to Azure.
- **Azure App Service:** Runs your Node.js app in a managed environment.
- **Managed Identity:** Provides secure, credential-free access to other Azure resources.
- **Application Insights:** Monitors app performance and logs errors.

---

## Prerequisites

Here’s what you’ll need to follow along:

- **Azure Account:** Sign up for free at [Azure](https://azure.microsoft.com/free). App Service and Application Insights are free tier eligible.
- **Basic Node.js Knowledge:** Familiarity with Express.js and package management (npm or yarn).
- **GitHub Account:** To host your code and configure GitHub Actions.
- **Azure CLI:** Install it [here](https://learn.microsoft.com/cli/azure/install-azure-cli) for local setup.
- **Code Editor:** Visual Studio Code or your favorite editor.

---

## Step 1: Setting Up the Node.js Express App Locally

Let’s start by creating a simple Express app.

1. Create a new project folder and initialize npm:
   ```bash
   mkdir node-express-azure
   cd node-express-azure
   npm init -y
   ```

2. Install Express and other dependencies:
   ```bash
   npm install express
   ```

3. Create `src/index.ts` (or `index.js` if you prefer JavaScript):
   ```typescript
   import express from "express";

   const app = express();
   const port = process.env.PORT || 3000;

   app.get("/", (req, res) => {
       res.send("Hello, Azure!");
   });

   app.listen(port, () => {
       console.log(`Server is running on http://localhost:${port}`);
   });
   ```

4. Add a start script to your `package.json`:
   ```json
   "scripts": {
       "start": "node dist/index.js"
   }
   ```

5. Test the app locally:
   ```bash
   npm run start
   ```

Your app should be running at `http://localhost:3000`.

---

## Step 2: Preparing Azure App Service

Now, let’s set up an Azure App Service instance.

1. Log in to Azure via the CLI:
   ```bash
   az login
   ```

2. Create a resource group (replace `myResourceGroup` with your name):
   ```bash
   az group create --name myResourceGroup --location eastus
   ```

3. Create an App Service plan:
   ```bash
   az appservice plan create --name myAppServicePlan --resource-group myResourceGroup --sku B1 --is-linux
   ```

4. Create a web app:
   ```bash
   az webapp create --resource-group myResourceGroup --plan myAppServicePlan --name myNodeApp --runtime "NODE|22-lts"
   ```

5. Enable managed identity for secure resource access:
   ```bash
   az webapp identity assign --name myNodeApp --resource-group myResourceGroup
   ```

---

## Step 3: Setting Up GitHub Actions for CI/CD

Time to automate deployment with GitHub Actions.

1. Push your project to a GitHub repository.

2. Create a `.github/workflows/deploy.yml` file:
   ```yaml
   name: Deploy to Azure App Service

   on:
     push:
       branches:
         - main

   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest

       steps:
       - name: Checkout code
         uses: actions/checkout@v3

       - name: Set up Node.js
         uses: actions/setup-node@v3
         with:
           node-version: '22'

       - name: Install dependencies
         run: npm install

       - name: Build the app
         run: npm run build

       - name: Deploy to Azure
         uses: azure/webapps-deploy@v2
         with:
           app-name: myNodeApp
           publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
   ```

3. Export a publish profile from Azure and add it as a GitHub secret (`AZURE_WEBAPP_PUBLISH_PROFILE`).

4. Push your changes and watch GitHub Actions deploy your app!

---

## Step 4: Integrating Application Insights

Let’s add monitoring to our app.

1. Enable Application Insights in the Azure Portal for your App Service.

2. Install the Application Insights SDK:
   ```bash
   npm install applicationinsights
   ```

3. Modify `src/index.ts` to include telemetry:
   ```typescript
   import appInsights from "applicationinsights";
   appInsights.setup().start();

   const client = appInsights.defaultClient;
   client.trackEvent({ name: "AppStarted" });
   ```

4. Deploy the updated app using GitHub Actions.

---

## Step 5: Cost Estimate

Here’s what this setup costs:

- **Azure App Service (B1 plan):** Free for basic usage.
- **Application Insights:** Free tier includes limited telemetry data.
- **Scaling:** Costs increase for higher tiers, but you’re covered for small apps.

---

## Step 6: Cleanup Instructions

Don’t forget to clean up when you’re done:

1. Delete the resource group:
   ```bash
   az group delete --name myResourceGroup --yes --no-wait
   ```

This ensures you won’t be charged for unused resources.

---

## Conclusion

Congratulations! You’ve deployed a modern Node.js Express app to Azure with GitHub Actions, integrated managed identity for security, and added Application Insights for monitoring. This is just the beginning—Azure App Service offers scaling, custom domains, and more.

If you’re ready to take the next step, explore [Azure documentation](https://learn.microsoft.com/en-us/azure/app-service/) or check out my GitHub repo with the full sample code.

Happy coding!