<script setup lang="ts">
import { useInstanceStore } from '~/stores/instance'

useHead({
  title: '本用户 | 设置'
})

const instanceStore = useInstanceStore()
</script>

<template>
  <div class="max-w-[800px] mx-auto space-y-8 pb-12 animate-[fade-in_0.3s_ease-out]">
    
    <!-- Header: Avatar (Left) & Banner (Right) -->
    <section class="flex flex-col sm:flex-row gap-6 items-stretch">
      <!-- Left: Avatar -->
      <div class="w-full sm:w-48 shrink-0 flex flex-col items-center justify-center bg-white dark:bg-gray-900 rounded-[30px] border border-gray-200 dark:border-gray-800 shadow-sm p-6 group/avatar relative">
        <div class="w-32 h-32 rounded-full ring-4 ring-gray-100 dark:ring-gray-800 shadow-xl overflow-hidden relative bg-white dark:bg-gray-800">
          <img src="https://avatars.githubusercontent.com/u/739984?v=4" class="w-full h-full object-cover" alt="User Avatar">
          
          <!-- Modify Avatar Hover -->
          <div class="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/avatar:bg-black/40 transition-all duration-300 z-10 cursor-pointer">
            <UButton
              icon="i-material-symbols-photo-camera"
              color="neutral"
              variant="ghost"
              class="opacity-0 group-hover/avatar:opacity-100 scale-90 group-hover/avatar:scale-100 hover:bg-white/20 transition-all rounded-full w-12 h-12 flex items-center justify-center text-white"
            />
          </div>
        </div>
        
        <!-- Decorate Button -->
        <UButton
          icon="i-material-symbols-auto-awesome"
          color="primary"
          label="装饰"
          size="xs"
          class="rounded-full shadow-lg font-bold mt-4 z-20"
        />
      </div>

      <!-- Right: Banner -->
      <div class="flex-1 bg-white dark:bg-gray-900 rounded-[30px] border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden relative group/banner min-h-[160px] sm:min-h-full cursor-pointer">
        <!-- Placeholder Banner Pattern -->
        <div class="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-primary-500/20" />
        
        <!-- Modify Banner Hover -->
        <div class="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/banner:bg-black/20 backdrop-blur-0 group-hover/banner:backdrop-blur-[2px] transition-all duration-300 z-10">
          <UButton
            icon="i-material-symbols-image"
            label="修改横幅"
            color="neutral"
            variant="solid"
            class="opacity-0 group-hover/banner:opacity-100 scale-95 group-hover/banner:scale-100 transition-all shadow-lg rounded-full font-bold px-4 text-gray-900"
          />
        </div>
      </div>
    </section>

    <!-- Information Forms -->
    <section class="flex flex-col gap-5 w-full">
      <!-- Nickname -->
      <UFormGroup label="昵称" required class="w-full">
        <UInput 
          modelValue="Yuna Ayase" 
          placeholder="输入您的昵称" 
          size="lg"
          class="font-bold text-lg w-full block"
          :ui="{ root: 'shadow-sm', base: 'bg-white dark:bg-gray-900 rounded-2xl w-full' }"
        />
      </UFormGroup>

      <!-- Bio / Description -->
      <UFormGroup label="个人简介" class="w-full">
        <UTextarea 
          modelValue="一位技术党，iMikufans技术组一员。&#10;我是Yuna Ayase，爱好作编曲、搞编程立项、深入探索计算机领域的深渊。&#10;#Misskey #iMikufans #CyaniAgent"
          placeholder="介绍一下你自己..." 
          :rows="5"
          size="lg"
          class="custom-scrollbar w-full block"
          :ui="{ root: 'shadow-sm', base: 'bg-white dark:bg-gray-900 rounded-2xl resize-none w-full' }"
        />
        <div class="flex justify-between items-center mt-2 px-1 w-full">
          <span class="text-[11px] text-gray-400 dark:text-gray-500">可以在个人简介中包含 #标签。</span>
          <UButton label="预览" variant="ghost" color="primary" size="xs" />
        </div>
      </UFormGroup>

      <!-- Location -->
      <UFormGroup label="位置" class="w-full">
        <UInput 
          modelValue="/Data/Users/Yuna Ayase" 
          icon="i-material-symbols-location-on" 
          placeholder="您的位置" 
          size="lg"
          class="w-full block"
          :ui="{ root: 'shadow-sm', base: 'bg-white dark:bg-gray-900 rounded-2xl w-full' }"
        />
      </UFormGroup>

      <!-- Birthday -->
      <UFormGroup label="生日" class="w-full">
        <UInput 
          icon="i-material-symbols-cake" 
          placeholder="年 / 月 / 日" 
          type="date"
          size="lg"
          class="w-full block"
          :ui="{ root: 'shadow-sm', base: 'bg-white dark:bg-gray-900 rounded-2xl w-full' }"
        />
      </UFormGroup>

      <!-- Language -->
      <UFormGroup label="语言" class="w-full">
        <USelectMenu 
          :options="['自动跟随浏览器', '简体中文', 'English', '日本語']" 
          modelValue="简体中文" 
          size="lg"
          class="w-full block"
          :ui="{ base: 'bg-white dark:bg-gray-900 rounded-2xl shadow-sm w-full' }"
        />
      </UFormGroup>

      <!-- Additional Info Fields Accordion -->
      <UFormGroup class="w-full mt-2">
        <UButton
          icon="i-material-symbols-list"
          label="附加信息编辑"
          color="neutral"
          variant="soft"
          size="lg"
          class="w-full justify-between items-center rounded-2xl bg-white dark:bg-gray-900 shadow-sm text-gray-700 dark:text-gray-300 font-bold"
          trailingIcon="i-material-symbols-keyboard-arrow-down"
        />
      </UFormGroup>
    </section>

    <!-- Account Actions -->
    <section class="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-3">
      <h3 class="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-2 mb-2">账户管理</h3>
      
      <UButton
        icon="i-material-symbols-settings"
        label="设置的配置"
        color="neutral"
        variant="ghost"
        size="lg"
        class="w-full justify-start rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 font-bold"
      />
      <UButton
        icon="i-material-symbols-delete"
        label="清除缓存"
        color="neutral"
        variant="ghost"
        size="lg"
        class="w-full justify-start rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 font-bold"
      />
      <div class="pt-4">
        <UButton
          icon="i-material-symbols-power-settings-new"
          label="登出此帐号"
          color="error"
          variant="soft"
          size="lg"
          class="w-full justify-center rounded-[20px] font-black text-base transition-transform hover:scale-[1.02] active:scale-95 shadow-sm py-3"
        />
      </div>
    </section>
  </div>
</template>
