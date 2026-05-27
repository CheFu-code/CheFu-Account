"use client";

import { BookOpenCheck } from "lucide-react";
import { SaveButton, SectionCard, SelectField, TextField, ToggleRow } from "../AccountControls";
import type { AccountSettingsFormProps } from "../account-form-types";
import { contentFormats, lessonStyles, skillLevels } from "../account-data";
import type { AccountProfile } from "../account-types";

export function AcademySection(props: AccountSettingsFormProps) {
    return (
        <SectionCard
            icon={BookOpenCheck}
            title="Academy learning"
            description="Tune the learning experience CheFu Academy uses for recommendations."
            action={<SaveButton isSaving={props.isSaving} label="Save learning" />}
        >
            <div className="grid gap-4 md:grid-cols-2">
                <TextField
                    label="Learning goal"
                    value={props.learningGoal}
                    onChange={props.setLearningGoal}
                    placeholder="What do you want to learn next?"
                    wide
                />
                <SelectField
                    label="Skill level"
                    value={props.skillLevel || "beginner"}
                    onChange={(value) =>
                        props.onSkillLevelChange(value as AccountProfile["skillLevel"])
                    }
                    options={skillLevels}
                />
                <TextField
                    label="Weekly lessons"
                    type="number"
                    value={props.weeklyLearningGoal}
                    onChange={props.setWeeklyLearningGoal}
                    min={1}
                    max={21}
                />
                <SelectField
                    label="Lesson style"
                    value={props.lessonStyle || "example-heavy"}
                    onChange={(value) =>
                        props.onLessonStyleChange(value as AccountProfile["lessonStyle"])
                    }
                    options={lessonStyles}
                />
                <SelectField
                    label="Course difficulty"
                    value={props.defaultCourseDifficulty || "beginner"}
                    onChange={(value) =>
                        props.onDefaultCourseDifficultyChange(
                            value as AccountProfile["defaultCourseDifficulty"],
                        )
                    }
                    options={skillLevels}
                />
                <SelectField
                    label="Preferred format"
                    value={props.preferredContentFormat || "examples"}
                    onChange={(value) =>
                        props.onPreferredContentFormatChange(
                            value as AccountProfile["preferredContentFormat"],
                        )
                    }
                    options={contentFormats}
                />
                <TextField
                    label="Learning interests"
                    value={props.learningInterestsInput}
                    onChange={props.onLearningInterestsInputChange}
                    placeholder="AI, Web development, Data analysis"
                    wide
                />
            </div>
            <div className="mt-4 divide-y divide-white/10 border-t border-white/10">
                <ToggleRow
                    checked={props.aiTutorSuggestions}
                    title="AI tutor suggestions"
                    description="Use your learning profile to personalize course and tutor suggestions."
                    onToggle={props.onToggleAiTutorSuggestions}
                />
            </div>
        </SectionCard>
    );
}
