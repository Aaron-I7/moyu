<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { supabase } from '@/core/supabase/client'

const { t } = useI18n({ useScope: 'global' })

const features = computed(() => [
  { 
    icon: 'mdi:rocket-launch', 
    title: t('about.features.instant'), 
    desc: t('about.features.instantDesc'),
    color: '#3B82F6'
  },
  { 
    icon: 'mdi:shield-check', 
    title: t('about.features.privacy'), 
    desc: t('about.features.privacyDesc'),
    color: '#10B981'
  },
  { 
    icon: 'mdi:responsive', 
    title: t('about.features.adaptive'), 
    desc: t('about.features.adaptiveDesc'),
    color: '#8B5CF6'
  },
  { 
    icon: 'mdi:gift-open', 
    title: t('about.features.free'), 
    desc: t('about.features.freeDesc'),
    color: '#F59E0B'
  }
])

// Feedback Form
const feedbackContent = ref('')
const feedbackContact = ref('')
const isSubmitting = ref(false)
const submitStatus = ref<'idle' | 'success' | 'error'>('idle')

const handleSubmit = async () => {
  if (!feedbackContent.value.trim()) return
  
  isSubmitting.value = true
  submitStatus.value = 'idle'
  
  try {
    if (!supabase) throw new Error('Supabase not configured')
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase
      .from('feedbacks')
      .insert({
        content: feedbackContent.value,
        contact: feedbackContact.value || null,
        user_id: user?.id || null
      })
      
    if (error) throw error
    
    submitStatus.value = 'success'
    feedbackContent.value = ''
    feedbackContact.value = ''
    
    setTimeout(() => {
      submitStatus.value = 'idle'
    }, 5000)
    
  } catch (e) {
    console.error('Feedback error:', e)
    submitStatus.value = 'error'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="about-page">
    <div class="about-container">
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-icon">
          <Icon icon="mdi:fish" width="48" />
        </div>
        <h1 class="hero-title">{{ t('about.title') }}</h1>
        <p class="hero-desc">{{ t('about.missionDesc') }}</p>
      </section>

      <!-- Features Grid -->
      <section class="features-section">
        <h2 class="section-title">{{ t('about.features.title') }}</h2>
        <div class="features-grid">
          <div 
            v-for="feature in features" 
            :key="feature.title" 
            class="feature-card"
            :style="{ '--feature-color': feature.color }"
          >
            <div class="feature-icon">
              <Icon :icon="feature.icon" width="24" />
            </div>
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.desc }}</p>
          </div>
        </div>
      </section>

      <!-- Feedback Section -->
      <section class="feedback-section">
        <div class="feedback-card">
          <div class="feedback-header">
            <Icon icon="mdi:message-draw" width="32" class="header-icon" />
            <div>
              <h2>{{ t('about.feedback.title') }}</h2>
              <p>{{ t('about.feedback.subtitle') }}</p>
            </div>
          </div>
          
          <form @submit.prevent="handleSubmit" class="feedback-form">
            <div class="form-group">
              <label>{{ t('about.feedback.contentLabel') }}</label>
              <textarea 
                v-model="feedbackContent"
                :placeholder="t('about.feedback.contentPlaceholder')"
                rows="4"
                required
                :disabled="isSubmitting"
              ></textarea>
            </div>
            
            <div class="form-group">
              <label>{{ t('about.feedback.contactLabel') }}</label>
              <div class="input-wrapper">
                <Icon icon="mdi:email-outline" class="input-icon" />
                <input 
                  v-model="feedbackContact"
                  type="text"
                  :placeholder="t('about.feedback.contactPlaceholder')"
                  :disabled="isSubmitting"
                />
              </div>
            </div>
            
            <div class="form-actions">
              <div v-if="submitStatus === 'success'" class="status-msg success">
                <Icon icon="mdi:check-circle" /> {{ t('about.feedback.success') }}
              </div>
              <div v-else-if="submitStatus === 'error'" class="status-msg error">
                <Icon icon="mdi:alert-circle" /> {{ t('about.feedback.error') }}
              </div>
              
              <button 
                type="submit" 
                class="submit-btn" 
                :disabled="isSubmitting || !feedbackContent.trim()"
              >
                <Icon v-if="isSubmitting" icon="mdi:loading" class="spin" />
                <span v-else>{{ t('about.feedback.submit') }}</span>
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.about-page {
  flex: 1;
  overflow-y: auto;
  padding: 40px 20px;
}

.about-container {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 60px;
}

.hero-section {
  text-align: center;
  padding: 40px 0;
  
  .hero-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 24px;
    background: color-mix(in srgb, var(--color-primary) 10%, transparent);
    color: var(--color-primary);
    border-radius: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .hero-title {
    font-size: 36px;
    font-weight: 700;
    color: var(--color-text);
    margin-bottom: 16px;
    letter-spacing: -0.02em;
  }
  
  .hero-desc {
    font-size: 18px;
    color: var(--color-text-secondary);
    line-height: 1.6;
    max-width: 600px;
    margin: 0 auto;
  }
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 24px;
  text-align: center;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.feature-card {
  padding: 24px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    border-color: var(--feature-color);
    box-shadow: 0 8px 20px -6px color-mix(in srgb, var(--feature-color) 15%, transparent);
  }
  
  .feature-icon {
    width: 48px;
    height: 48px;
    background: color-mix(in srgb, var(--feature-color) 10%, transparent);
    color: var(--feature-color);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
  }
  
  h3 {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: 8px;
  }
  
  p {
    font-size: 14px;
    color: var(--color-text-secondary);
    line-height: 1.6;
  }
}

.feedback-section {
  .feedback-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 24px;
    padding: 32px;
    box-shadow: var(--shadow-sm);
  }
  
  .feedback-header {
    display: flex;
    gap: 16px;
    margin-bottom: 24px;
    
    .header-icon {
      color: var(--color-primary);
      padding-top: 4px;
    }
    
    h2 {
      font-size: 20px;
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: 4px;
    }
    
    p {
      font-size: 14px;
      color: var(--color-text-secondary);
    }
  }
}

.feedback-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    
    label {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text);
      margin-left: 4px;
    }
    
    textarea, input {
      width: 100%;
      padding: 12px 16px;
      border-radius: 12px;
      border: 1px solid var(--color-border);
      background: var(--color-background);
      color: var(--color-text);
      font-size: 15px;
      transition: all 0.2s;
      font-family: inherit;
      
      &:focus {
        border-color: var(--color-primary);
        outline: none;
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 10%, transparent);
      }
      
      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
    }
    
    textarea {
      resize: vertical;
      min-height: 100px;
    }
    
    .input-wrapper {
      position: relative;
      
      .input-icon {
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--color-text-secondary);
        pointer-events: none;
      }
      
      input {
        padding-left: 42px;
      }
    }
  }
  
  .form-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 16px;
    margin-top: 8px;
    
    .status-msg {
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 6px;
      
      &.success { color: var(--color-success); }
      &.error { color: var(--color-error); }
    }
    
    .submit-btn {
      padding: 10px 24px;
      background: var(--color-primary);
      color: white;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
      
      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px color-mix(in srgb, var(--color-primary) 30%, transparent);
      }
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
  }
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 600px) {
  .about-page {
    padding: 20px 16px;
  }
  
  .about-container {
    gap: 40px;
  }
  
  .hero-title {
    font-size: 28px;
  }
}
</style>