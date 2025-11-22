

import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import type { Project } from '../types';
import { TrashIcon } from './icons/TrashIcon';

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onLoad: (projectId: string) => void;
  onDelete: (projectId: string) => void;
  onNew: () => void;
  currentProjectId: string | null;
}

const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({ isOpen, onClose, onSave, onLoad, onDelete, onNew, currentProjectId }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const refreshProjects = () => {
        const savedProjects = localStorage.getItem('mojo-book-writer-projects');
        if (savedProjects) {
            setProjects(JSON.parse(savedProjects));
        } else {
            setProjects([]);
        }
    }

    useEffect(() => {
        if (isOpen) {
            refreshProjects();
        }
    }, [isOpen]);

    const handleSave = () => {
        onSave();
        refreshProjects();
    };

    const handleDelete = (projectId: string) => {
        if (window.confirm('Are you sure you want to delete this project? This cannot be undone.')) {
            onDelete(projectId);
            setProjects(prev => prev.filter(p => p.id !== projectId));
        }
    };
    
    const handleNewProject = () => {
        if (window.confirm('Are you sure you want to start a new project? Any unsaved changes will be lost.')) {
            onNew();
            onClose();
        }
    }
    
    const handleLoadProject = (projectId: string) => {
        if (window.confirm('Loading a project will discard any unsaved changes to your current work. Continue?')) {
            onLoad(projectId);
            onClose();
        }
    }

    const handleExport = () => {
        const savedProjects = localStorage.getItem('mojo-book-writer-projects');
        if (!savedProjects || savedProjects === '[]') {
            alert("No projects to export.");
            return;
        }
        const blob = new Blob([savedProjects], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mojo-book-writer-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File could not be read.");
                const importedProjects: Project[] = JSON.parse(text);
                
                // Basic validation
                if (!Array.isArray(importedProjects)) {
                    throw new Error("Invalid project file: The file should contain a list of projects.");
                }

                const savedProjectsRaw = localStorage.getItem('mojo-book-writer-projects');
                let existingProjects: Project[] = savedProjectsRaw ? JSON.parse(savedProjectsRaw) : [];
                const existingProjectMap = new Map(existingProjects.map(p => [p.id, p]));

                let importedCount = 0;
                let updatedCount = 0;

                importedProjects.forEach(importedProject => {
                    // More validation for each project object
                    if (typeof importedProject.id !== 'string' || typeof importedProject.name !== 'string' || typeof importedProject.lastModified !== 'number') {
                       console.warn("Skipping invalid project object during import:", importedProject);
                       return;
                    }

                    if (existingProjectMap.has(importedProject.id)) {
                        updatedCount++;
                    } else {
                        importedCount++;
                    }
                    existingProjectMap.set(importedProject.id, importedProject);
                });
                
                const mergedProjects = Array.from(existingProjectMap.values());
                localStorage.setItem('mojo-book-writer-projects', JSON.stringify(mergedProjects));
                
                alert(`Import successful!\n- ${importedCount} new project(s) added.\n- ${updatedCount} existing project(s) updated.`);
                refreshProjects();

            } catch (error) {
                alert(`Import failed: ${(error as Error).message}`);
            } finally {
                // Reset file input to allow re-uploading the same file
                if (event.target) {
                    event.target.value = '';
                }
            }
        };
        reader.readAsText(file);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Manage Projects">
            <div className="space-y-6 text-gray-300">
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={handleSave} className="w-full px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700">
                        Save Current Project
                    </button>
                     <button onClick={handleNewProject} className="w-full px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
                        Start New Project
                    </button>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <button onClick={handleExport} className="w-full px-4 py-2 text-sm font-semibold text-white bg-gray-600 rounded-lg hover:bg-gray-700">
                        Export All to File
                    </button>
                    <button onClick={handleImportClick} className="w-full px-4 py-2 text-sm font-semibold text-white bg-gray-600 rounded-lg hover:bg-gray-700">
                        Import from File
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".json"
                        className="hidden"
                    />
                </div>

                <div>
                    <h3 className="text-lg font-medium text-white mb-2">Saved Projects</h3>
                    {projects.length > 0 ? (
                        <ul className="space-y-2 max-h-80 overflow-y-auto">
                            {projects.sort((a,b) => b.lastModified - a.lastModified).map(project => (
                                <li key={project.id} className={`flex items-center justify-between p-3 rounded-lg ${currentProjectId === project.id ? 'bg-indigo-900/50 ring-1 ring-indigo-700' : 'bg-gray-700/50'}`}>
                                    <div>
                                        <p className="font-semibold text-white">{project.name}</p>
                                        <p className="text-sm text-gray-400">Last saved: {new Date(project.lastModified).toLocaleString()}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleLoadProject(project.id)} className="px-3 py-1 text-sm bg-blue-600 rounded-md hover:bg-blue-700">
                                            Load
                                        </button>
                                        <button onClick={() => handleDelete(project.id)} className="p-2 text-gray-400 hover:text-red-400" title="Delete Project">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-gray-500 text-center py-8 border-2 border-dashed border-gray-600 rounded-lg">
                            <p>No projects saved yet.</p>
                            <p className="text-sm mt-1">Click "Save Current Project" to get started, or import projects from a file.</p>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default ProjectManagerModal;