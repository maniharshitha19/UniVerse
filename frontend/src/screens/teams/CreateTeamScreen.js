import { useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Text, TextInput, Chip, IconButton, Button, HelperText, useTheme } from 'react-native-paper';
import client, { getErrorMessage } from '../../api/client';
import { getData, commonSkills } from '../../api/mappers';

export default function CreateTeamScreen({ navigation }) {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventName, setEventName] = useState('');
  const [skills, setSkills] = useState([]);
  const [skillText, setSkillText] = useState('');
  const [maxMembers, setMaxMembers] = useState(4);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addSkill = (value) => {
    const skill = value.trim();
    if (skill && !skills.some((s) => s.toLowerCase() === skill.toLowerCase())) {
      setSkills([...skills, skill]);
    }
    setSkillText('');
  };

  const submit = async () => {
    if (!title.trim() || !description.trim()) {
      setError('Please add a title and a short description.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await client.post('/api/teams', {
        title: title.trim(),
        description: description.trim(),
        eventName: eventName.trim() || undefined,
        skillsNeeded: skills,
        maxMembers,
      });
      const data = getData(res);
      const id = data?.team?.id ?? data?.id;
      if (id) navigation.replace('TeamDetail', { teamId: id });
      else navigation.goBack();
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <TextInput mode="outlined" label="Team title" value={title} onChangeText={setTitle} style={styles.input} />
      <TextInput
        mode="outlined"
        label="What are you building?"
        multiline
        numberOfLines={4}
        value={description}
        onChangeText={setDescription}
        style={styles.input}
      />
      <TextInput
        mode="outlined"
        label="Event or competition (optional)"
        value={eventName}
        onChangeText={setEventName}
        style={styles.input}
      />

      <Text variant="titleSmall" style={styles.label}>
        Skills you need
      </Text>
      <View style={styles.skillRow}>
        <TextInput
          mode="outlined"
          dense
          placeholder="Type a skill"
          value={skillText}
          onChangeText={setSkillText}
          onSubmitEditing={() => addSkill(skillText)}
          style={styles.skillInput}
        />
        <Button mode="contained-tonal" onPress={() => addSkill(skillText)}>
          Add
        </Button>
      </View>
      <View style={styles.chips}>
        {skills.map((s) => (
          <Chip key={s} onClose={() => setSkills(skills.filter((x) => x !== s))}>
            {s}
          </Chip>
        ))}
      </View>
      <Text variant="bodySmall" style={styles.hint}>
        Quick add:
      </Text>
      <View style={styles.chips}>
        {commonSkills
          .filter((s) => !skills.includes(s))
          .map((s) => (
            <Chip key={s} compact mode="outlined" onPress={() => addSkill(s)}>
              {s}
            </Chip>
          ))}
      </View>

      <Text variant="titleSmall" style={styles.label}>
        Team size (including you)
      </Text>
      <View style={styles.stepper}>
        <IconButton
          icon="minus"
          mode="contained-tonal"
          disabled={maxMembers <= 2}
          onPress={() => setMaxMembers(maxMembers - 1)}
        />
        <Text variant="headlineSmall" style={styles.count}>
          {maxMembers}
        </Text>
        <IconButton
          icon="plus"
          mode="contained-tonal"
          disabled={maxMembers >= 10}
          onPress={() => setMaxMembers(maxMembers + 1)}
        />
      </View>

      <HelperText type="error" visible={Boolean(error)}>
        {error}
      </HelperText>
      <Button
        mode="contained"
        loading={saving}
        disabled={saving}
        onPress={submit}
        contentStyle={styles.buttonContent}
        style={styles.button}
      >
        Create team
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  input: { marginBottom: 16 },
  label: { marginTop: 8, marginBottom: 8, fontWeight: '700' },
  skillRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  skillInput: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  hint: { marginTop: 16, opacity: 0.7 },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  count: { minWidth: 48, textAlign: 'center', fontWeight: '700' },
  button: { marginTop: 8, borderRadius: 12 },
  buttonContent: { paddingVertical: 6 },
});
