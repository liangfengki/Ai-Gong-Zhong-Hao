#!/bin/bash
# AI公众号写作助手 - 一键启动脚本
# 启动3个服务：DailyHotApi(6688) → Server(6356) → Frontend(5173)

set -e
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🚀 AI公众号写作助手 - 启动中..."
echo "=================================="

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 清理函数
cleanup() {
  echo -e "\n${YELLOW}正在停止所有服务...${NC}"
  kill $DAILYHOT_PID $SERVER_PID $FRONTEND_PID 2>/dev/null
  wait $DAILYHOT_PID $SERVER_PID $FRONTEND_PID 2>/dev/null
  echo -e "${GREEN}✅ 所有服务已停止${NC}"
  exit 0
}
trap cleanup SIGINT SIGTERM

# 1. 启动 DailyHotApi
echo -e "${YELLOW}[1/3] 启动 DailyHotApi (端口 6688)...${NC}"
cd "$PROJECT_DIR/dailyhot-api"
npx tsx src/index.ts &
DAILYHOT_PID=$!
sleep 3

# 检查 DailyHotApi
if curl -s http://localhost:6688/baidu > /dev/null 2>&1; then
  echo -e "${GREEN}✅ DailyHotApi 启动成功${NC}"
else
  echo -e "${RED}⚠️  DailyHotApi 启动失败，热点功能可能不可用${NC}"
fi

# 2. 启动 Server
echo -e "${YELLOW}[2/3] 启动后端服务 (端口 6356)...${NC}"
cd "$PROJECT_DIR/server"
node index.js &
SERVER_PID=$!
sleep 2

# 检查 Server
if curl -s http://localhost:6356/baidu/hot > /dev/null 2>&1; then
  echo -e "${GREEN}✅ 后端服务启动成功${NC}"
else
  echo -e "${RED}⚠️  后端服务启动失败${NC}"
fi

# 3. 启动 Frontend
echo -e "${YELLOW}[3/3] 启动前端服务 (端口 5173)...${NC}"
cd "$PROJECT_DIR/app"
npm run dev &
FRONTEND_PID=$!
sleep 3

echo ""
echo "=================================="
echo -e "${GREEN}🎉 所有服务已启动！${NC}"
echo ""
echo "  📝 前端地址:    http://localhost:5173"
echo "  🔧 后端地址:    http://localhost:6356"
echo "  🔥 热点API:     http://localhost:6688"
echo ""
echo "  按 Ctrl+C 停止所有服务"
echo "=================================="

# 等待所有进程
wait
