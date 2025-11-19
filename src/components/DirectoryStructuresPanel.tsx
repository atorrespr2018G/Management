'use client';

import {
    Grid,
} from '@mui/material';
import NeoDirectoryStructureCard from './NeoDirectoryStructureCard';
import { useNeo4jStructure } from '@/hooks/useNeo4jStructure';
import ScannedDirectoryStructureCard from './ScannedDirectoryStructureCard';
import { DirectoryStructuresProps } from '@/types/components';

/**
 * Shows the LOCAL (scanned) directory structure and the Neo4j directory structure side-by-side
 */
const DirectoryStructuresPanel = ({
    node,
    machineId,
    isStoring,
    storeMessage,
    onStoreInNeo4j,
    onGraphDataChanged
}: DirectoryStructuresProps) => {
    const { fetchNeo4jStructure } = useNeo4jStructure({ machineId, node });

    return (
        <Grid container spacing={2}>
            {/* Scanned / Local Directory */}
            <Grid item xs={12} md={6}>
                <ScannedDirectoryStructureCard
                    node={node}
                    machineId={machineId}
                    storeMessage={storeMessage}
                    isStoring={isStoring}
                    onStoreInNeo4j={onStoreInNeo4j}
                    fetchNeo4jStructure={fetchNeo4jStructure}
                />
            </Grid>

            {/* Neo4j Directory */}
            <Grid item xs={12} md={6}>
                <NeoDirectoryStructureCard fetchNeo4jStructure={fetchNeo4jStructure} onGraphDataChanged={onGraphDataChanged} />
            </Grid>
        </Grid>
    );
};

export default DirectoryStructuresPanel;
