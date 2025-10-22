# GitHub Pages Deployment Guide

This guide explains how to deploy the Nigerian PSR 2021 CBT Quiz application to GitHub Pages.

## Prerequisites

- A GitHub account
- Git installed on your local machine
- The repository already created on GitHub

## Steps to Deploy

### 1. Repository Setup

1. Ensure your repository is properly configured with all necessary files
2. Make sure you have an `index.html` file as the main entry point
3. Verify that all assets (CSS, JS, images, data files) are properly organized

### 2. Configuration Files

The project includes a `_config.yml` file that configures GitHub Pages:

```yaml
title: Directorate Levels Promotion CBT Practice
description: A comprehensive CBT Quiz application for Nigerian PSR 2021
baseurl: "/Promotion-cbt-app"
url: "https://timdasa75.github.io"
theme: jekyll-theme-minimal
```

### 3. Update Configuration

1. Update the `url` field in `_config.yml` with your GitHub username:
   ```yaml
   url: "https://your-github-username.github.io"
   ```

2. Update the `baseurl` field if your repository name is different:
   ```yaml
   baseurl: "/your-repository-name"
   ```

### 4. Commit and Push Changes

1. Add all files to git:
   ```bash
   git add .
   ```

2. Commit your changes:
   ```bash
   git commit -m "Configure GitHub Pages settings"
   ```

3. Update the remote URL with your GitHub username:
   ```bash
   git remote set-url origin https://github.com/your-github-username/your-repository-name.git
   ```

4. Push changes to GitHub:
   ```bash
   git push origin main
   ```

### 5. Configure GitHub Pages

1. Go to your repository on GitHub
2. Click on the "Settings" tab
3. Scroll down to the "Pages" section
4. Under "Source", select "Deploy from a branch"
5. Select "main" branch and "/ (root)" folder
6. Click "Save"
7. GitHub Pages will automatically build and deploy your site

### 6. Access Your Deployed Site

After deployment, your site will be available at:
```
https://your-github-username.github.io/your-repository-name/
```

For this project, it will be available at:
```
https://timdasa75.github.io/Promotion-cbt-app/
```

## Important Notes

- The application uses JavaScript modules which require serving over HTTP/HTTPS rather than the file:// protocol
- GitHub Pages provides the necessary HTTP server for the application to work properly
- All data files (JSON) must be in the correct location relative to the root for the quiz questions to load
- The application is responsive and will work on both desktop and mobile devices

## Using a URL Shortener

For easier sharing, you can use a URL shortener service to create a more user-friendly link to your quiz application:

1. Once your GitHub Pages site is live, copy the full URL:
   ```
   https://timdasa75.github.io/Promotion-cbt-app/
   ```

2. Use a URL shortening service such as:
   - Bitly (https://bitly.com)
   - TinyURL (https://tinyurl.com)
   - Rebrandly (https://rebrandly.com)
   - Your own domain with a service like Firebase Dynamic Links

3. Paste your GitHub Pages URL into the shortener and create your shortened link

Example of shortened URL options:
- `https://bit.ly/promotion-quiz`
- `https://tinyurl.com/nigerian-psr-quiz`

Note that while using a URL shortener provides a cleaner link for sharing, the underlying GitHub Pages site will remain the same.
