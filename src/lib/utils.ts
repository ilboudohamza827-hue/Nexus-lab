import type { Opportunity, QuestionnaireAnswers, RecommendationResult, StudyField } from '@/lib/types';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function extractYouTubeId(url: string): string {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return '';
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return 'Non précisée';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateTime(dateString: string | null): string {
  if (!dateString) return 'Non précisée';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function daysUntilDeadline(deadline: string | null): number | null {
  if (!deadline) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dl = new Date(deadline);
  dl.setHours(0, 0, 0, 0);
  const diff = dl.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isExpired(opportunity: Opportunity): boolean {
  if (opportunity.status === 'expiree' || opportunity.status === 'archivee') return true;
  const days = daysUntilDeadline(opportunity.deadline);
  if (days !== null && days < 0) return true;
  return false;
}

export function deadlineLabel(opportunity: Opportunity): string {
  const days = daysUntilDeadline(opportunity.deadline);
  if (days === null) return 'Date limite non précisée';
  if (days < 0) return 'Expirée';
  if (days === 0) return 'Dernier jour aujourd\'hui !';
  if (days === 1) return 'Demain';
  if (days <= 7) return `Dans ${days} jours`;
  if (days <= 30) return `Dans ${days} jours`;
  return formatDate(opportunity.deadline);
}

export function deadlineColor(opportunity: Opportunity): string {
  const days = daysUntilDeadline(opportunity.deadline);
  if (days === null) return 'text-gray-500';
  if (days < 0) return 'text-red-600 font-semibold';
  if (days <= 3) return 'text-red-600 font-semibold';
  if (days <= 14) return 'text-yellow-700 font-medium';
  return 'text-gray-500';
}

const LEVEL_ORDER: Record<string, number> = {
  'Collège': 1,
  'Lycée': 2,
  'Terminale / Bac': 3,
  'Licence / Bachelor': 4,
  'Master': 5,
  'Doctorat': 6,
  'Formation professionnelle': 3,
  'Autre': 0,
};

const DESTINATION_TO_COUNTRIES: Record<string, string[]> = {
  'Burkina Faso': ['Burkina Faso', 'BF'],
  'Autres pays d\'Afrique': ['Afrique', 'Africa'],
  'Europe': ['Europe'],
  'Amérique du Nord': ['Amérique', 'USA', 'Canada', 'États-Unis', 'Canada'],
  'Asie': ['Asie', 'Asia'],
};

export function computeRecommendation(
  opportunity: Opportunity,
  answers: QuestionnaireAnswers,
  studyFields: StudyField[],
): RecommendationResult {
  const reasons: string[] = [];
  let score = 0;
  let hasMismatch = false;

  // Study level matching
  if (answers.study_level && opportunity.study_level) {
    if (opportunity.study_level === answers.study_level) {
      score += 30;
      reasons.push(`tu es en ${answers.study_level} et cette opportunité concerne ce niveau`);
    } else {
      const userLevel = LEVEL_ORDER[answers.study_level] ?? 0;
      const oppLevel = LEVEL_ORDER[opportunity.study_level] ?? 0;
      if (oppLevel > 0 && userLevel > 0 && Math.abs(userLevel - oppLevel) <= 1) {
        score += 10;
      } else {
        hasMismatch = true;
      }
    }
  }

  // Study field matching
  if (answers.study_fields && answers.study_fields.length > 0 && opportunity.study_fields) {
    const oppFieldSlugs = opportunity.study_fields.map((f) => f.slug);
    const matchingFields = answers.study_fields.filter((slug) => {
      const field = studyFields.find((f) => f.slug === slug);
      return field && oppFieldSlugs.includes(field.slug);
    });
    if (matchingFields.length > 0) {
      score += 25 * matchingFields.length;
      const fieldNames = matchingFields.map((slug) => {
        const f = studyFields.find((sf) => sf.slug === slug);
        return f?.name ?? slug;
      });
      reasons.push(`cette opportunité correspond à ton domaine d'intérêt (${fieldNames.join(', ')})`);
    }
  }

  // Destination matching
  if (answers.destination && opportunity.eligible_countries.length > 0) {
    const preferredCountries = DESTINATION_TO_COUNTRIES[answers.destination] ?? [];
    if (answers.destination === 'Toutes les destinations') {
      score += 5;
    } else {
      const hasMatch = opportunity.eligible_countries.some((c) =>
        preferredCountries.some((pc) =>
          c.toLowerCase().includes(pc.toLowerCase()) || pc.toLowerCase().includes(c.toLowerCase()),
        ),
      );
      if (hasMatch) {
        score += 20;
        reasons.push(`cette opportunité est disponible dans ta zone de préférence (${answers.destination})`);
      }
    }
  }

  // Objectives matching (via category)
  if (answers.objectives && answers.objectives.length > 0 && opportunity.category) {
    const categorySlug = opportunity.category.slug;
    const objectiveMap: Record<string, string[]> = {
      'Trouver une bourse d\'études': ['bourses-detudes'],
      'Étudier dans un autre pays': ['echanges-mobilite'],
      'Trouver une formation gratuite': ['formations-gratuites'],
      'Participer à un concours': ['concours-competitions'],
      'Trouver un stage': ['stages'],
      'Découvrir des programmes académiques': ['programmes-etudiants'],
      'Développer des compétences': ['developpement-competences'],
      'Explorer différentes possibilités': [],
    };
    for (const obj of answers.objectives) {
      const slugs = objectiveMap[obj] ?? [];
      if (slugs.includes(categorySlug)) {
        score += 15;
        reasons.push(`cette opportunité correspond à ton objectif « ${obj} »`);
      }
    }
  }

  // Deadline urgency bonus
  const days = daysUntilDeadline(opportunity.deadline);
  if (days !== null && days >= 0 && days <= 30) {
    score += 5;
  }

  // Freshness bonus
  if (opportunity.published_at) {
    const pubDate = new Date(opportunity.published_at);
    const ageDays = (Date.now() - pubDate.getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays <= 14) score += 5;
  }

  let matchType: RecommendationResult['matchType'] = 'to_verify';
  if (hasMismatch) {
    matchType = 'no_match';
    score = Math.min(score, 5);
  } else if (score >= 25) {
    matchType = 'confirmed';
  } else if (score === 0) {
    matchType = 'no_match';
  }

  return {
    opportunity,
    matchType,
    score,
    reasons: reasons.slice(0, 3),
  };
}

export function sortByDeadline(a: Opportunity, b: Opportunity): number {
  const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
  const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
  return da - db;
}
