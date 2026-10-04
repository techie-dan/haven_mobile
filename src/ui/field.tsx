import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from "react-native";

import { AppText } from "@/ui/text";
import { fonts, palette, radius, spacing } from "@/theme";

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize = "words",
  secureTextEntry,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (next: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  secureTextEntry?: boolean;
  multiline?: boolean;
}) {
  return (
    <View style={styles.wrap}>
      <AppText variant="eyebrow" style={styles.label}>
        {label}
      </AppText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.muted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        style={[styles.input, multiline && styles.inputMultiline]}
      />
    </View>
  );
}

/** Label + tap-to-open list, for a fixed set of options like Nigerian states. */
export function SelectField({
  label,
  value,
  placeholder,
  options,
  onSelect,
}: {
  label: string;
  value: string;
  placeholder?: string;
  options: readonly string[];
  onSelect: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.wrap}>
      <AppText variant="eyebrow" style={styles.label}>
        {label}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => setOpen(true)}
        style={styles.input}>
        <AppText variant="body" color={value ? palette.ink : palette.muted}>
          {value || placeholder || "Select…"}
        </AppText>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <ScrollView>
              {options.map((option) => {
                const active = option === value;
                return (
                  <Pressable
                    key={option}
                    onPress={() => {
                      onSelect(option);
                      setOpen(false);
                    }}
                    style={styles.option}>
                    <AppText
                      variant="body"
                      style={active ? styles.optionActive : undefined}>
                      {option}
                    </AppText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  label: { color: palette.inkSoft },
  input: {
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.surface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: fonts.body,
    fontSize: 14,
    color: palette.ink,
  },
  inputMultiline: { minHeight: 72, textAlignVertical: "top" },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(28,26,23,0.45)",
    justifyContent: "center",
    padding: spacing.xl,
  },
  sheet: {
    maxHeight: "70%",
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.line,
    paddingVertical: spacing.sm,
  },
  option: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  optionActive: { color: palette.terracotta },
});
