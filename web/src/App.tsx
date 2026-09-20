/**
 * App — Vite 入口组件
 *
 * 替代 Next.js 的 src/app/layout.tsx。
 * 负责：HTML 语义结构、全局样式导入、Provider 包裹、路由渲染。
 */
import { ClientLayout } from "@/components/layout/ClientLayout";
import { ServiceWorkerRegistration } from "@/components/providers/ServiceWorkerRegistration";

export function App() {
  return (
    <>
      <ServiceWorkerRegistration />
      <ClientLayout />
    </>
  );
}
