<script setup lang="ts">
import OmaIcon from "../../ui/Icon.vue";
import { useWorkspaceScope } from "../../app/scope";
const {
  applyCronBuilder,
  autopilotCron,
  buildCron,
  cronBuilderOpen,
  cronDay,
  cronDayOfMonth,
  cronDaysOfMonth,
  cronFrequency,
  cronHour,
  cronHours,
  cronMinute,
  cronMonth,
  cronMonths,
  setCronFrequency,
  toggleCronDay,
} = useWorkspaceScope([
  "applyCronBuilder",
  "autopilotCron",
  "buildCron",
  "cronBuilderOpen",
  "cronDay",
  "cronDayOfMonth",
  "cronDaysOfMonth",
  "cronFrequency",
  "cronHour",
  "cronHours",
  "cronMinute",
  "cronMonth",
  "cronMonths",
  "setCronFrequency",
  "toggleCronDay",
]);
</script>
<template>
  <dialog
    class="modal modal-middle"
    :open="Boolean(cronBuilderOpen)"
    v-show="cronBuilderOpen"
    @click.self="cronBuilderOpen = false"
  >
    <div class="modal-box cron-builder-dialog">
      <div class="dialog-head">
        <div>
          <div class="eyebrow">Schedule</div>
          <h2>Cron builder</h2>
        </div>
        <button class="icon-btn" @click="cronBuilderOpen = false" aria-label="Close">
          <OmaIcon name="x" aria-hidden="true" />
        </button>
      </div>
      <div class="cron-builder-body">
        <div class="cron-section">
          <label>Frequency</label>
          <div class="join cron-frequency">
            <template
              v-for="option in [
                { id: 'hourly', label: 'Hourly' },
                { id: 'daily', label: 'Daily' },
                { id: 'weekly', label: 'Weekly' },
                { id: 'monthly', label: 'Monthly' },
                { id: 'yearly', label: 'Yearly' },
              ]"
              :key="option.id"
              ><button
                type="button"
                class="btn btn-sm join-item"
                :class="cronFrequency === option.id ? 'btn-primary' : 'btn-ghost'"
                @click="setCronFrequency(option.id)"
                v-text="option.label"
              ></button
            ></template>
          </div>
        </div>
        <div class="cron-section" v-show="cronFrequency === 'weekly'">
          <label>Day of week</label>
          <div class="cron-choice-grid cron-days">
            <template
              v-for="day in [
                { id: '0', label: 'Sun' },
                { id: '1', label: 'Mon' },
                { id: '2', label: 'Tue' },
                { id: '3', label: 'Wed' },
                { id: '4', label: 'Thu' },
                { id: '5', label: 'Fri' },
                { id: '6', label: 'Sat' },
              ]"
              :key="day.id"
              ><button
                type="button"
                class="btn btn-sm"
                :class="cronDay.includes(day.id) ? 'btn-primary' : 'btn-ghost'"
                @click="toggleCronDay(day.id)"
                v-text="day.label"
              ></button
            ></template>
          </div>
        </div>
        <div class="cron-extra-grid cron-date-month-grid">
          <div class="cron-section" v-show="cronFrequency === 'monthly' || cronFrequency === 'yearly'">
            <label for="cron-day-of-month">Day of month</label
            ><select
              id="cron-day-of-month"
              class="select select-bordered"
              v-model="cronDayOfMonth"
              @change="autopilotCron = buildCron()"
            >
              <template v-for="day in cronDaysOfMonth()" :key="day"
                ><option :value="day" v-text="day"></option
              ></template>
            </select>
          </div>
          <div class="cron-section" v-show="cronFrequency === 'yearly'">
            <label for="cron-month">Month</label
            ><select
              id="cron-month"
              class="select select-bordered"
              v-model="cronMonth"
              @change="autopilotCron = buildCron()"
            >
              <template v-for="month in cronMonths()" :key="month"
                ><option :value="month" v-text="month"></option
              ></template>
            </select>
          </div>
        </div>
        <div class="cron-columns" v-show="cronFrequency !== 'hourly'">
          <div class="cron-section">
            <label>Hour</label>
            <div class="cron-choice-grid cron-hours">
              <template v-for="hour in cronHours()" :key="hour"
                ><button
                  type="button"
                  class="btn btn-sm"
                  :class="cronHour === hour ? 'btn-primary' : 'btn-ghost'"
                  @click="
                    cronHour = hour;
                    autopilotCron = buildCron();
                  "
                  v-text="hour.padStart(2, '0')"
                ></button
              ></template>
            </div>
          </div>
          <div class="cron-section">
            <label>Minute</label>
            <div class="cron-choice-grid cron-minutes">
              <template
                v-for="minute in ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']"
                :key="minute"
                ><button
                  type="button"
                  class="btn btn-sm"
                  :class="cronMinute === String(Number(minute)) ? 'btn-primary' : 'btn-ghost'"
                  @click="
                    cronMinute = String(Number(minute));
                    autopilotCron = buildCron();
                  "
                  v-text="minute"
                ></button
              ></template>
            </div>
          </div>
        </div>
        <div class="cron-section" v-show="cronFrequency === 'hourly'">
          <label>Minute</label>
          <div class="cron-choice-grid cron-minutes">
            <template
              v-for="minute in ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']"
              :key="minute"
              ><button
                type="button"
                class="btn btn-sm"
                :class="cronMinute === String(Number(minute)) ? 'btn-primary' : 'btn-ghost'"
                @click="
                  cronMinute = String(Number(minute));
                  autopilotCron = buildCron();
                "
                v-text="minute"
              ></button
            ></template>
          </div>
        </div>
        <p class="cron-preview">Schedule: <code v-text="buildCron()"></code></p>
      </div>
      <div class="dialog-actions">
        <button class="btn btn-sm btn-ghost" @click="cronBuilderOpen = false">Cancel</button
        ><button class="btn btn-sm btn-primary" @click="applyCronBuilder()">Apply</button>
      </div>
    </div>
  </dialog>
</template>
