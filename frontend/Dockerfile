FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# 子路径部署：/ai_project/workbenchByAgent
ARG PUBLIC_PATH=/ai_project/workbenchByAgent
ENV PUBLIC_URL=$PUBLIC_PATH
ENV REACT_APP_API_BASE_URL=$PUBLIC_PATH/api

RUN npm run build

FROM nginx:1.27-alpine
# 构建产物放到子路径，与 nginx location 一致
COPY --from=build /app/build /usr/share/nginx/html/ai_project/workbenchByAgent
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
