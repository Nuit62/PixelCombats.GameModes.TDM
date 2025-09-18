// библиотека расчёта очков за изменения карты
import { BreackGraph } from 'pixel_combats/room';

const SCORES_PROP_NAME = "Scores";

const ENEMY_BLOCK_SCORE = 25;
// корневые ID блоков команд
const RED_TEAM_ROOT_BLOCK_ID = 33;
const BLUE_TEAM_ROOT_BLOCK_ID = 28;

// получить союзный/вражеский корневой блок для игрока
function getAllyEnemyRootIds(player, blueTeam, redTeam) {
	if (!player || !player.Team) return { allyRootId: 0, enemyRootId: 0 };
	if (player.Team === blueTeam)
		return { allyRootId: BLUE_TEAM_ROOT_BLOCK_ID, enemyRootId: RED_TEAM_ROOT_BLOCK_ID };
	if (player.Team === redTeam)
		return { allyRootId: RED_TEAM_ROOT_BLOCK_ID, enemyRootId: BLUE_TEAM_ROOT_BLOCK_ID };
	return { allyRootId: 0, enemyRootId: 0 };
}

// расчёт очков за редактирование карты
// details: IMapChangeDetails
// breackGraph: IBreackGraphService
// allyRootBlockId / enemyRootBlockId: корневые ID блоков команд относительно игрока
function calcMapEditScore(details, allyRootBlockId, enemyRootBlockId) {
    if (!details || !details.MapChange) return 0;
    const mapChange = details.MapChange;
    // постановка блока (одиночный или линия) — +5 очков за событие
    if (mapChange.BlockId > 0) return 5;

    // поломка блока определяем как изменение блока на 0 (стирание)
    const isDeletion = mapChange.BlockId === 0;
    if (!isDeletion) return 0;

	// удаление: анализируем, что было до изменения (старые блоки в области)
	const oldList = details.OldMapData || [];
	let total = 0;
	let mapBlocksAwarded = 0; // лимит на очки за блоки карты (1–2 за событие)
	for (let i = 0; i < oldList.length; ++i) {
		const old = oldList[i];
		if (!old) continue;
		if (!old.BlockId || old.BlockId === 0) continue; // пропускаем пустоту
		const root = BreackGraph.BlockRoot(old.BlockId);
		if (root === enemyRootBlockId) {
			// разрушение блока врага
			total += ENEMY_BLOCK_SCORE;
		}
		else if (root === allyRootBlockId) {
			// разрушение своего/союзного блока — без очков
			// total += 0;
		}
		else {
			// блок карты — символические очки, максимум 2 за событие
			if (mapBlocksAwarded < 2) {
				total += 1;
				++mapBlocksAwarded;
			}
		}
	}
	return total;
}

// применяет начисления очков игроку за редактирование карты
export function applyMapEditScores(player, details, blueTeam, redTeam) {
	if (!player) return;
	if (!details || !details.MapChange) return;
	const roots = getAllyEnemyRootIds(player, blueTeam, redTeam);
    const add = calcMapEditScore(details, roots.allyRootId, roots.enemyRootId);
	player.Properties.Scores.Value += add;
}


