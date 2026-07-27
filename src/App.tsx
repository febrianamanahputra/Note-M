import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Plus, X, Clock, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { Category, Task } from './types';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

export default function App() {
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('orchidCategoriesV3');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [
      { id: 'cat-1', title: 'Rutinitas', tasks: [] },
      { id: 'cat-2', title: 'Pekerjaan', tasks: [] }
    ];
  });

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryTitle, setNewCategoryTitle] = useState('');
  
  const [addingTaskId, setAddingTaskId] = useState<string | null>(null);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('orchidCategoriesV3', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    const interval = setInterval(() => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      
      let updated = false;
      const newCategories = categories.map(cat => {
        const newTasks = cat.tasks.map(task => {
          if (
            !task.isCompleted &&
            !task.notified &&
            task.reminderTime === currentTimeStr
          ) {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Pengingat: ' + task.text, {
                body: `Kategori: ${cat.title}`,
                icon: '/favicon.ico',
              });
            }
            updated = true;
            return { ...task, notified: true };
          }
          return task;
        });
        return { ...cat, tasks: newTasks };
      });

      if (updated) {
        setCategories(newCategories);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [categories]);

  const handleAddCategory = () => {
    if (!newCategoryTitle.trim()) return;
    const newCat: Category = {
      id: crypto.randomUUID(),
      title: newCategoryTitle,
      tasks: []
    };
    setCategories([...categories, newCat]);
    setNewCategoryTitle('');
    setIsAddingCategory(false);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceCategoryId = result.source.droppableId;
    const destCategoryId = result.destination.droppableId;

    const newCategories = Array.from(categories);
    const sourceCategoryIndex = newCategories.findIndex(c => c.id === sourceCategoryId);
    const destCategoryIndex = newCategories.findIndex(c => c.id === destCategoryId);

    const sourceCategory = newCategories[sourceCategoryIndex];
    const destCategory = newCategories[destCategoryIndex];

    const sourceTasks = Array.from(sourceCategory.tasks);
    const destTasks = sourceCategoryId === destCategoryId ? sourceTasks : Array.from(destCategory.tasks);

    const [movedTask] = sourceTasks.splice(result.source.index, 1);

    if (sourceCategoryId === destCategoryId) {
      sourceTasks.splice(result.destination.index, 0, movedTask);
      newCategories[sourceCategoryIndex] = { ...sourceCategory, tasks: sourceTasks };
    } else {
      destTasks.splice(result.destination.index, 0, movedTask);
      newCategories[sourceCategoryIndex] = { ...sourceCategory, tasks: sourceTasks };
      newCategories[destCategoryIndex] = { ...destCategory, tasks: destTasks };
    }

    setCategories(newCategories);
  };

  const handleAddTask = (categoryId: string) => {
    if (!newTaskText.trim()) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      text: newTaskText,
      isCompleted: false,
      reminderTime: newTaskTime || undefined,
    };

    const newCategories = categories.map(c => 
      c.id === categoryId ? { ...c, tasks: [...c.tasks, newTask] } : c
    );

    setCategories(newCategories);
    setNewTaskText('');
    setNewTaskTime('');
    setAddingTaskId(null);
  };

  const handleDeleteTask = (categoryId: string, taskId: string) => {
    const newCategories = categories.map(c => 
      c.id === categoryId ? { ...c, tasks: c.tasks.filter(t => t.id !== taskId) } : c
    );
    setCategories(newCategories);
  };

  const toggleComplete = (categoryId: string, taskId: string) => {
    const newCategories = categories.map(c => 
      c.id === categoryId ? { 
        ...c, 
        tasks: c.tasks.map(t => t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t)
      } : c
    );
    setCategories(newCategories);
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategories(categories.filter(c => c.id !== categoryId));
  };

  return (
    <div 
      className="min-h-screen font-sans relative overflow-hidden bg-cover bg-center bg-fixed flex flex-col"
      style={{ backgroundImage: 'url("https://i.pinimg.com/736x/a9/aa/04/a9aa047f57fc039087ed8066e37d1546.jpg")' }}
    >
      {/* Soft Light Orbs for Glass Theme */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/20 rounded-full blur-3xl pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#6A1B9A]/20 rounded-full blur-3xl pointer-events-none z-0"></div>
      
      <div className="relative z-10 flex flex-col h-screen">
        <header className="px-8 py-6 text-white drop-shadow-md flex items-center shrink-0">
          <Calendar size={32} className="opacity-90 mr-3" />
          <h1 className="text-3xl font-extrabold tracking-tight">Note Minimalism</h1>
        </header>

        <div className="flex-1 overflow-x-auto overflow-y-hidden px-8 pb-8" ref={scrollContainerRef}>
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-6 h-full items-start min-w-max">
              {categories.map((category) => (
                <div 
                  key={category.id} 
                  id={`category-${category.id}`}
                  className="flex-shrink-0 w-[320px] flex flex-col h-full max-h-full bg-white/20 backdrop-blur-md rounded-3xl border border-white/40 shadow-xl overflow-hidden"
                >
                  {/* Category Header */}
                  <div className="p-5 flex items-center justify-between border-b border-white/20">
                    <h3 className="font-bold text-white text-xl tracking-wide drop-shadow-md">{category.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold bg-white/30 text-white px-2.5 py-1 rounded-full shadow-sm">
                        {category.tasks.length}
                      </span>
                      <button 
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-white/60 hover:text-white transition-colors p-1"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <Droppable droppableId={category.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 overflow-y-auto p-4 transition-colors custom-scrollbar ${snapshot.isDraggingOver ? 'bg-white/10' : ''}`}
                      >
                        <div className="space-y-3 min-h-[50px]">
                          {category.tasks.map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-sm flex flex-col gap-2 transition-all text-gray-800
                                    ${snapshot.isDragging ? 'shadow-2xl scale-105 ring-2 ring-white/70' : 'hover:bg-white/50 hover:shadow-md'}
                                    ${task.isCompleted ? 'opacity-50 bg-white/20' : ''}`}
                                >
                                  <div className="flex items-start gap-3">
                                    <button onClick={() => toggleComplete(category.id, task.id)} className="mt-0.5 flex-shrink-0 text-gray-800 transition-transform hover:scale-110">
                                      {task.isCompleted ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                                    </button>
                                    <span className={`flex-1 break-words font-medium text-[15px] leading-snug ${task.isCompleted ? 'line-through' : ''}`}>
                                      {task.text}
                                    </span>
                                    <button 
                                      onClick={() => handleDeleteTask(category.id, task.id)}
                                      className="text-gray-600 hover:text-red-500 transition-colors p-1 flex-shrink-0 opacity-0 group-hover:opacity-100 md:opacity-100"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                  {task.reminderTime && (
                                    <div className="flex items-center gap-1.5 text-xs font-semibold ml-9 bg-white/30 self-start px-2.5 py-1 rounded-lg">
                                      <Clock size={12} />
                                      {task.reminderTime}
                                    </div>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                        
                        {addingTaskId === category.id ? (
                          <div className="mt-4 p-4 bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 shadow-md">
                            <textarea
                              autoFocus
                              value={newTaskText}
                              onChange={(e) => setNewTaskText(e.target.value)}
                              placeholder="Ketik kegiatan..."
                              className="w-full text-[15px] resize-none focus:outline-none bg-transparent font-medium text-gray-800 placeholder-gray-600"
                              rows={2}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleAddTask(category.id);
                                }
                              }}
                            />
                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/30">
                              <div className="flex items-center gap-2">
                                <Clock size={18} className="text-gray-700" />
                                <input
                                  type="time"
                                  value={newTaskTime}
                                  onChange={(e) => setNewTaskTime(e.target.value)}
                                  className="text-sm bg-transparent border-b border-gray-400 px-1 text-gray-800 focus:outline-none focus:border-gray-800 font-medium"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setAddingTaskId(null)}
                                  className="w-8 h-8 flex items-center justify-center rounded-full text-gray-700 hover:bg-white/40 transition-colors"
                                >
                                  <X size={18} />
                                </button>
                                <button
                                  onClick={() => handleAddTask(category.id)}
                                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 text-white hover:bg-black transition-colors shadow-md"
                                >
                                  <Plus size={18} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAddingTaskId(category.id)}
                            className="mt-4 w-full flex items-center justify-center p-3 rounded-2xl bg-white/10 text-white hover:bg-white/30 transition-all border border-white/20 shadow-sm group"
                          >
                            <Plus size={24} className="group-hover:scale-110 transition-transform" />
                          </button>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
              
              {isAddingCategory ? (
                <div className="flex-shrink-0 w-[320px] bg-white/20 backdrop-blur-md rounded-3xl p-5 shadow-xl border border-white/40">
                  <input 
                    autoFocus
                    value={newCategoryTitle}
                    onChange={e => setNewCategoryTitle(e.target.value)}
                    placeholder="Nama Kategori..."
                    className="w-full bg-transparent border-b border-white/50 focus:border-white focus:outline-none text-xl font-bold text-white placeholder-white/60 pb-2"
                    onKeyDown={e => { if(e.key === 'Enter') handleAddCategory() }}
                  />
                  <div className="flex justify-end gap-3 mt-4">
                     <button onClick={() => setIsAddingCategory(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors">
                        <X size={20} />
                     </button>
                     <button onClick={handleAddCategory} className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-gray-800 hover:bg-white/90 transition-colors shadow-md">
                        <Plus size={20} />
                     </button>
                  </div>
                </div>
              ) : (
                <div className="flex-shrink-0 w-[320px]">
                  <button
                    onClick={() => setIsAddingCategory(true)}
                    className="w-full h-[80px] flex items-center justify-center rounded-3xl bg-white/10 text-white hover:bg-white/20 transition-all border-2 border-dashed border-white/40 hover:border-white/60 group shadow-sm"
                  >
                    <Plus size={32} className="group-hover:scale-110 group-hover:rotate-90 transition-transform duration-300" />
                  </button>
                </div>
              )}
            </div>
          </DragDropContext>
        </div>
      </div>
    </div>
  );
}
