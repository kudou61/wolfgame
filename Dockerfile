FROM node:22-alpine

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm install --production=false

# 复制源代码
COPY . .

# 安装 production 依赖
RUN npm ci --production

# 构建前端
RUN npm run build

# 设置环境变量
ENV NODE_ENV=production

# 创建数据目录
RUN mkdir -p /app/data

# 暴露端口
EXPOSE 3000

# 启动服务
CMD ["node", "server.js"]
