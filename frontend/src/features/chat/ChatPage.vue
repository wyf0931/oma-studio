<script setup lang="ts">
import { vOutside } from "../../ui/events";
import OmaIcon from "../../ui/Icon.vue";
import { useWorkspaceScope } from "../../app/scope";
const {
  abort,
  activeChat,
  agentName,
  agentPickerOpen,
  agents,
  attachmentCommandIndex,
  attachmentCommandItems,
  attachmentCommandVisible,
  avatarUrl,
  cancelEditingChatTitle,
  cancelShare,
  chatTitleDraft,
  chooseAgent,
  chooseFileAttachment,
  chooseSkillCommand,
  copiedKey,
  copyMessage,
  createShare,
  creatingShare,
  draft,
  editingChatTitle,
  handleAttachmentKeydown,
  handleContentDragEnter,
  handleContentDragLeave,
  handleContentDragOver,
  handlePaste,
  handleSkillCommandKeydown,
  handleUploadDrop,
  handleUploadSelection,
  initials,
  isActionableAssistant,
  loading,
  messageVisible,
  messages,
  messagesLoading,
  openUploadPicker,
  page,
  pendingAttachments,
  removePendingAttachment,
  renderMessage,
  requestRevokeShare,
  resizeConversationInput,
  resizeStartInput,
  runError,
  saveChatTitle,
  selectedAgentId,
  sendFirst,
  sendMessage,
  sessionUsageMarkup,
  shareMode,
  sharedCanManage,
  sharedMode,
  sharedToken,
  skillCommandHighlightHtml,
  skillCommandIndex,
  skillCommandItems,
  skillCommandVisible,
  startEditingChatTitle,
  startShare,
  syncSkillCommandScroll,
  t,
  toggleFiles,
  updateAttachmentCommandState,
  updateSkillCommandState,
  uploadDragActive,
  uploadingFiles,
} = useWorkspaceScope([
  "abort",
  "activeChat",
  "agentName",
  "agentPickerOpen",
  "agents",
  "attachmentCommandIndex",
  "attachmentCommandItems",
  "attachmentCommandVisible",
  "avatarUrl",
  "cancelEditingChatTitle",
  "cancelShare",
  "chatTitleDraft",
  "chooseAgent",
  "chooseFileAttachment",
  "chooseSkillCommand",
  "copiedKey",
  "copyMessage",
  "createShare",
  "creatingShare",
  "draft",
  "editingChatTitle",
  "handleAttachmentKeydown",
  "handleContentDragEnter",
  "handleContentDragLeave",
  "handleContentDragOver",
  "handlePaste",
  "handleSkillCommandKeydown",
  "handleUploadDrop",
  "handleUploadSelection",
  "initials",
  "isActionableAssistant",
  "loading",
  "messageVisible",
  "messages",
  "messagesLoading",
  "openUploadPicker",
  "page",
  "pendingAttachments",
  "removePendingAttachment",
  "renderMessage",
  "requestRevokeShare",
  "resizeConversationInput",
  "resizeStartInput",
  "runError",
  "saveChatTitle",
  "selectedAgentId",
  "sendFirst",
  "sendMessage",
  "sessionUsageMarkup",
  "shareMode",
  "sharedCanManage",
  "sharedMode",
  "sharedToken",
  "skillCommandHighlightHtml",
  "skillCommandIndex",
  "skillCommandItems",
  "skillCommandVisible",
  "startEditingChatTitle",
  "startShare",
  "syncSkillCommandScroll",
  "t",
  "toggleFiles",
  "updateAttachmentCommandState",
  "updateSkillCommandState",
  "uploadDragActive",
  "uploadingFiles",
]);
</script>
<template>
  <section
    class="content-panel"
    data-ref="chatContent"
    v-show="page === 'chat'"
    @dragenter.prevent="handleContentDragEnter($event)"
    @dragover.prevent="handleContentDragOver($event)"
    @dragleave.prevent="handleContentDragLeave($event)"
    @drop.prevent="handleUploadDrop($event)"
  >
    <input
      data-ref="uploadInput"
      hidden
      type="file"
      multiple
      @change="handleUploadSelection($event)"
      :disabled="uploadingFiles"
      :aria-label="t('chat.browseFiles')"
    />
    <div class="drag-upload-overlay" v-show="uploadDragActive" aria-hidden="true">
      <OmaIcon name="upload-cloud" aria-hidden="true" />
      <strong v-text="t('chat.dropFilesHere')"></strong>
      <span v-text="t('chat.dropFilesHint')"></span>
    </div>
    <template v-if="!activeChat">
      <div class="chat-empty">
        <div class="chat-empty-logo">
          <img :src="'/static/oma-logo-transparent.png'" alt="OMA studio" />
        </div>
        <h1 v-text="t('chat.stayHungry')"></h1>
        <p class="chat-empty-subtitle" v-text="t('chat.whatShouldWeDo')"></p>
        <div class="start-grid">
          <div class="aura aura-rainbow aura-lg">
            <div class="start-card rounded-box">
              <div class="composer-attachments start-attachments" v-show="pendingAttachments().length">
                <template v-for="file in pendingAttachments()" :key="file.id || 'artifact:' + file.path">
                  <span class="composer-attachment">
                    <OmaIcon name="paperclip" aria-hidden="true" /><span
                      v-text="'@' + (file.filename || file.name)"
                    ></span
                    ><button
                      type="button"
                      @click="removePendingAttachment(file)"
                      :aria-label="t('common.remove') + ' ' + (file.filename || file.name)"
                    >
                      <OmaIcon name="x" aria-hidden="true" />
                    </button>
                  </span>
                </template>
              </div>
              <div class="skill-command-editor">
                <div
                  class="skill-command-highlight"
                  data-ref="skillCommandHighlight"
                  aria-hidden="true"
                  data-rendered-content=""
                  v-html="skillCommandHighlightHtml()"
                ></div>
                <textarea
                  id="new-chat-message"
                  name="message"
                  rows="2"
                  class="textarea textarea-bordered start-input"
                  v-model="draft"
                  @input="
                    resizeStartInput($event);
                    updateSkillCommandState();
                  "
                  @paste="handlePaste($event)"
                  @scroll="syncSkillCommandScroll($event)"
                  @keydown="handleSkillCommandKeydown($event); if ($event.key === 'Enter' &amp;&amp; $event.metaKey) { $event.preventDefault(); sendFirst(); }"
                  :placeholder="t('chat.whatExplore')"
                ></textarea>
              </div>
              <div
                class="skill-command-palette"
                v-show="skillCommandVisible()"
                role="listbox"
                aria-label="Available skills"
              >
                <template v-for="(skill, index) in skillCommandItems()" :key="skill.id">
                  <button
                    type="button"
                    class="skill-command-option"
                    :class="{ selected: index === skillCommandIndex }"
                    role="option"
                    :aria-selected="index === skillCommandIndex"
                    @mousedown.prevent="chooseSkillCommand(skill)"
                  >
                    <span class="skill-command-name" v-text="'/skill:' + skill.name"></span>
                    <span class="skill-command-description" v-text="skill.description || 'Run this skill'"></span>
                  </button>
                </template>
                <div class="skill-command-empty" v-show="!skillCommandItems().length">
                  No enabled skills for this Agent
                </div>
              </div>
              <div class="start-composer-foot">
                <div
                  class="agent-picker"
                  v-outside="
                    () => {
                      agentPickerOpen = false;
                    }
                  "
                >
                  <button
                    type="button"
                    class="agent-picker-button"
                    @click="agentPickerOpen = !agentPickerOpen"
                    aria-haspopup="listbox"
                    :aria-expanded="agentPickerOpen"
                  >
                    <template v-if="avatarUrl(agents.find((agent) => agent.id === selectedAgentId))"
                      ><img
                        class="agent-avatar agent-avatar-image"
                        :src="avatarUrl(agents.find((agent) => agent.id === selectedAgentId))"
                        alt="" /></template
                    ><template v-if="!avatarUrl(agents.find((agent) => agent.id === selectedAgentId))"
                      ><span class="agent-avatar" v-text="initials(agentName(selectedAgentId))"></span></template
                    ><span v-text="agentName(selectedAgentId)"></span
                    ><OmaIcon class="picker-chevron" name="chevron-down" aria-hidden="true" />
                  </button>
                  <div class="agent-picker-menu" v-show="agentPickerOpen" role="listbox">
                    <template v-for="agent in agents" :key="agent.id"
                      ><button
                        type="button"
                        role="option"
                        class="agent-picker-option"
                        :aria-selected="selectedAgentId === agent.id"
                        @click="chooseAgent(agent.id)"
                      >
                        <template v-if="avatarUrl(agent)"
                          ><img
                            class="agent-avatar agent-avatar-image"
                            :src="avatarUrl(agent)"
                            :alt="agent.name + ' avatar'" /></template
                        ><template v-if="!avatarUrl(agent)"
                          ><span class="agent-avatar" v-text="initials(agent.name)"></span></template
                        ><span><b v-text="agent.name"></b><small v-text="agent.instruction"></small></span></button
                    ></template>
                  </div>
                </div>
                <button
                  type="button"
                  class="btn btn-ghost btn-square upload-trigger"
                  @click="openUploadPicker()"
                  :disabled="uploadingFiles || !selectedAgentId"
                  :title="t('chat.attachFiles')"
                  :aria-label="t('chat.attachFiles')"
                >
                  <OmaIcon name="paperclip" aria-hidden="true" />
                </button>
                <button
                  class="icon-send"
                  :class="{ idle: !draft.trim() }"
                  @click="sendFirst()"
                  :disabled="!draft.trim() || !selectedAgentId || loading"
                  :title="t('chat.startChat')"
                  :aria-label="t('chat.startChat')"
                >
                  <OmaIcon name="arrow-up" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template v-if="activeChat">
      <div class="conversation">
        <div class="chat-header">
          <div class="chat-title-control">
            <button
              type="button"
              class="chat-title-display"
              v-show="!editingChatTitle"
              @click="startEditingChatTitle()"
              :title="sharedMode ? activeChat.title : 'Edit conversation title'"
              :aria-label="sharedMode ? activeChat.title : 'Edit conversation title'"
              v-text="activeChat.title"
            ></button>
            <input
              id="chat-title-input"
              class="input input-bordered chat-title-input"
              v-show="editingChatTitle"
              v-model="chatTitleDraft"
              maxlength="200"
              @keydown.enter.prevent="saveChatTitle()"
              @keydown.escape.prevent="cancelEditingChatTitle()"
              @blur="saveChatTitle()"
              aria-label="Conversation title"
            />
          </div>
          <button
            type="button"
            class="icon-btn chat-share-toggle"
            v-show="!sharedMode"
            @click="startShare()"
            :title="t('chat.shareMessage')"
            :aria-label="t('chat.shareMessage')"
          >
            <OmaIcon name="share-2" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="icon-btn chat-unshare-toggle"
            v-show="sharedMode && sharedCanManage"
            @click="requestRevokeShare({ token: sharedToken, kind: 'session' })"
            :title="t('share.revokeSession')"
            :aria-label="t('share.revokeSession')"
          >
            <OmaIcon name="link-2-off" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="icon-btn files-toggle"
            @click="toggleFiles()"
            title="Generated files"
            aria-label="Generated files"
          >
            <OmaIcon name="folder-input" aria-hidden="true" />
          </button>
        </div>
        <div class="message-list" data-ref="messages">
          <template v-if="runError"
            ><div class="alert alert-error mb-4" role="alert">
              <span v-text="runError"></span></div></template
          ><template v-if="messagesLoading"
            ><div class="chat-loading" role="status" aria-live="polite">
              <span class="loading loading-bars loading-md"></span>
              <span v-text="t('chat.loadingMessages')"></span></div
          ></template>
          <template v-for="message in messages" :key="message._key"
            ><article class="message" :class="message.role" v-show="messageVisible(message)">
              <div class="message-body" data-rendered-content="" v-html="renderMessage(message)"></div>
              <div class="assistant-footer" v-show="isActionableAssistant(message)">
                <div
                  class="session-usage"
                  data-rendered-content=""
                  v-html="sessionUsageMarkup()"
                  :aria-label="t('chat.sessionUsage')"
                ></div>
                <div class="message-actions">
                  <button
                    type="button"
                    class="action-btn"
                    :class="{ active: copiedKey === message._key }"
                    @click="copyMessage(message)"
                    :title="copiedKey === message._key ? t('chat.copied') : t('chat.copyMessage')"
                    :aria-label="t('chat.copyMessage')"
                  >
                    <OmaIcon name="check" v-show="copiedKey === message._key" aria-hidden="true" />
                    <OmaIcon name="copy" v-show="copiedKey !== message._key" aria-hidden="true" />
                  </button>
                </div>
              </div></article
          ></template>
        </div>
        <div class="composer" v-show="!shareMode">
          <div class="composer-attachments" v-show="pendingAttachments().length">
            <template v-for="file in pendingAttachments()" :key="file.id || 'artifact:' + file.path">
              <span class="composer-attachment">
                <OmaIcon name="paperclip" aria-hidden="true" /><span v-text="'@' + (file.filename || file.name)"></span
                ><button
                  type="button"
                  @click="removePendingAttachment(file)"
                  :aria-label="'Remove ' + (file.filename || file.name)"
                >
                  <OmaIcon name="x" aria-hidden="true" />
                </button>
              </span>
            </template>
          </div>
          <div class="composer-input-row">
            <textarea
              id="conversation-message"
              name="message"
              rows="1"
              class="textarea textarea-bordered"
              data-ref="conversationInput"
              v-model="draft"
              @input="
                resizeConversationInput($event);
                updateAttachmentCommandState();
              "
              @paste="handlePaste($event)"
              @keydown="handleAttachmentKeydown($event)"
              :disabled="loading"
              placeholder="Message this agent…"
            ></textarea
            ><button
              type="button"
              class="btn btn-ghost btn-square conversation-attach"
              @click="openUploadPicker()"
              :disabled="uploadingFiles || loading"
              title="Attach files"
              aria-label="Attach files"
            >
              <OmaIcon name="paperclip" aria-hidden="true" /></button
            ><button
              class="icon-send conversation-send"
              @click="loading ? abort() : sendMessage()"
              :class="{ abort: loading, idle: !loading && !draft.trim() }"
              :disabled="!loading && !draft.trim()"
              :title="loading ? 'Abort' : 'Send'"
              :aria-label="loading ? 'Abort' : 'Send'"
            >
              <OmaIcon name="arrow-up" v-show="!loading" aria-hidden="true" />
              <OmaIcon name="x" v-show="loading" aria-hidden="true" />
            </button>
          </div>
          <div class="attachment-command-palette" v-show="attachmentCommandVisible()" role="listbox">
            <template v-for="(file, index) in attachmentCommandItems()" :key="file.kind + ':' + file.id">
              <button
                type="button"
                role="option"
                :class="{ selected: index === attachmentCommandIndex }"
                :aria-selected="index === attachmentCommandIndex"
                @mousedown.prevent="chooseFileAttachment(file)"
              >
                <OmaIcon name="file-text" aria-hidden="true" /><span class="attachment-command-copy"
                  ><b v-text="'@' + file.name"></b
                  ><small v-text="file.kind === 'input' ? t('chat.inputs') : t('chat.outputs')"></small
                ></span>
              </button>
            </template>
          </div>
        </div>
        <div class="share-bar" v-show="shareMode">
          <span class="share-hint" v-text="t('share.barHint')"></span>
          <div class="share-bar-actions">
            <button type="button" class="btn btn-ghost" @click="cancelShare()" v-text="t('common.cancel')"></button>
            <button type="button" class="btn btn-primary" @click="createShare()" :disabled="creatingShare">
              <span v-text="creatingShare ? t('share.creating') : t('share.create')"></span>
            </button>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>
