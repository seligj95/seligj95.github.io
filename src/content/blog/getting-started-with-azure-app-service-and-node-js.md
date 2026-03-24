```yaml
---
title: "Deploy a Node.js App to Azure App Service Using Azure Developer CLI"
description: "Learn how to deploy a Node.js Express app to Azure App Service in minutes using Azure Developer CLI (azd). Perfect for beginners and free tier eligible."
pubDate: "2026-03-24"
heroImage: "/images/blog/deploy-nodejs-azure-app-service-hero.png"
tags: ["Azure App Service", "Node.js", "Express.js", "Azure Developer CLI", "Tutorial"]
category: "Tutorial"
author: "Jordan Selig"
---
```

# Deploy a Node.js App to Azure App Service Using Azure Developer CLI

Azure App Service is one of my go-to tools when it comes to hosting web apps. It’s fully managed, scales like a dream, and lets me focus on code instead of infrastructure. Today, I’ll walk you through deploying a simple Node.js Express app to Azure App Service using the Azure Developer CLI (`azd`). This approach is beginner-friendly and free tier eligible, making it perfect for experimenting without worrying about costs.

Let’s get started.

---

## Architecture Overview

Here’s the flow we’ll follow to get your app live on Azure:

```mermaid
graph TD
    A[Local Development] --> B[Azure Developer CLI (azd)]
    B --> C[Azure App Service]
    C --> D[Live Node.js App]
```

- **Local Development**: We’ll create a simple "hello-world" Node.js app using Express.
- **Azure Developer CLI (`azd`)**: This tool will handle deployment and resource setup for us.
- **Azure App Service**: Hosts our app with built-in scaling and monitoring.

---

## Prerequisites

Before jumping in, make sure you’ve got the following:

- **Azure Account**: Sign up for free if you don’t have one yet.
- **Azure Developer CLI (`azd`)**: Install it [here](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/install-azd).
- **Node.js**: Version 18.x or higher. Download [here](https://nodejs.org/).
- **Git**: For version control. Get it [here](https://git-scm.com/).
- **Code Editor**: Visual Studio Code is ideal, but use whatever you prefer.

---

## Step-by-Step Implementation

### Step 1: Create Your Node.js App

Let’s start by creating a simple Express.js app.

1. Open your terminal and create a new directory for the project:
   ```bash
   mkdir azure-node-app
   cd azure-node-app
   ```

2. Initialize a new Node.js project:
   ```bash
   npm init -y
   ```

3. Install Express:
   ```bash
   npm install express
   ```

4. Create a file named `index.js` and add the following code:

   ```typescript
   const express = require('express');
   const app = express();

   const port = process.env.PORT || 3000;

   app.get('/', (req, res) => {
       res.send('Hello, Azure!');
   });

   app.listen(port, () => {
       console.log(`Server is running on http://localhost:${port}`);
   });
   ```

5. Test your app locally:
   ```bash
   node index.js
   ```
   Open [http://localhost:3000](http://localhost:3000). You should see "Hello, Azure!"

---

### Step 2: Install Azure Developer CLI (`azd`)

Make sure `azd` is installed. If not, follow the [installation guide](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/install-azd). Once installed, verify it by running:

```bash
azd version
```

---

### Step 3: Initialize the Azure Project

1. Run the following command in your project directory:
   ```bash
   azd init
   ```
   Follow the prompts to select a template. For this tutorial, choose the **Node.js app template**.

2. This will set up necessary configuration files like `azure.yaml` and `.env`.

---

### Step 4: Deploy the App to Azure App Service

Now comes the magic. Deploy everything with one command:

```bash
azd up
```

Here’s what happens:
- `azd` provisions resources like App Service and related Azure services.
- It deploys your code to App Service.

Once the deployment is done, `azd` will output the URL of your live app. Open the URL, and you should see "Hello, Azure!" running on Azure.

---

### Step 5: Verify and Monitor Your App

1. Visit your app’s URL to verify it’s live.
2. Head to the Azure Portal and navigate to the App Service resource. You can access built-in monitoring tools to view logs, CPU usage, and more.

---

## Cost Estimate

Good news: this tutorial is free tier eligible! Azure App Service’s free tier lets you host up to 10 web apps with 1 GB of storage and 60 minutes of compute time per day.

If you decide to scale beyond the free tier, here’s a rough breakdown:
- **Basic Plan (B1)**: ~$13.39/month for small-scale apps.
- **Standard Plan (S1)**: ~$73.00/month for production-ready apps.

For learning purposes, stick to the free tier—you won’t be charged unless you manually upgrade your plan.

---

## Cleanup Instructions

When you’re done experimenting, it’s a good idea to tear down the resources to avoid accidental charges.

Run the following command to delete everything:

```bash
azd down
```

This will remove all Azure resources associated with your project. Double-check the Azure Portal to confirm.

---

## Conclusion

And there you have it! You just deployed a Node.js app to Azure App Service using the Azure Developer CLI. Here’s what we covered:
- Setting up a simple Express.js app.
- Using `azd` to deploy effortlessly.
- Verifying your app and understanding cost implications.
- Cleaning up resources to save money.

Next steps? Explore Azure App Service’s scaling options or integrate a database like Azure Cosmos DB. If you’re feeling adventurous, check out my guide on deploying a React frontend alongside your Node.js backend.

Happy coding! 🚀