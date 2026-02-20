-- Create Profile Settings Table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  daily_calories NUMERIC DEFAULT 2400,
  daily_protein NUMERIC DEFAULT 150,
  daily_carbs NUMERIC DEFAULT 250,
  daily_fat NUMERIC DEFAULT 80,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- set up RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Create Recipes Table
CREATE TABLE public.recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  notes TEXT,
  total_calories NUMERIC DEFAULT 0,
  total_protein NUMERIC DEFAULT 0,
  total_carbs NUMERIC DEFAULT 0,
  total_fat NUMERIC DEFAULT 0,
  total_fiber NUMERIC DEFAULT 0,
  total_sugar NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Recipe Ingredients Table
CREATE TABLE public.recipe_ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE,
  external_food_id TEXT,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  unit TEXT NOT NULL
);

-- Create Daily Logs Table
CREATE TABLE public.daily_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  calories NUMERIC DEFAULT 0,
  protein NUMERIC DEFAULT 0,
  carbs NUMERIC DEFAULT 0,
  fat NUMERIC DEFAULT 0,
  fiber NUMERIC DEFAULT 0,
  sugar NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can view own recipes" ON public.recipes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recipes" ON public.recipes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recipes" ON public.recipes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recipes" ON public.recipes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own recipe ingredients" ON public.recipe_ingredients FOR SELECT USING (EXISTS (SELECT 1 FROM public.recipes WHERE id = recipe_ingredients.recipe_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert own recipe ingredients" ON public.recipe_ingredients FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.recipes WHERE id = recipe_ingredients.recipe_id AND user_id = auth.uid()));
CREATE POLICY "Users can update own recipe ingredients" ON public.recipe_ingredients FOR UPDATE USING (EXISTS (SELECT 1 FROM public.recipes WHERE id = recipe_ingredients.recipe_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete own recipe ingredients" ON public.recipe_ingredients FOR DELETE USING (EXISTS (SELECT 1 FROM public.recipes WHERE id = recipe_ingredients.recipe_id AND user_id = auth.uid()));

CREATE POLICY "Users can view own daily logs" ON public.daily_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own daily logs" ON public.daily_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own daily logs" ON public.daily_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own daily logs" ON public.daily_logs FOR DELETE USING (auth.uid() = user_id);
