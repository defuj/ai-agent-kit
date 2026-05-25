# Android Testing Rules

## Unit Tests
- Use JUnit 5 + MockK for ViewModel/UseCase/Repository tests
- Each ViewModel must have a corresponding test file
- Test Loading → Success → Error state transitions
- Use `runTest` for coroutine-based ViewModels

```kotlin
@Test
fun `loadProducts emits loading then success`() = runTest {
    val viewModel = ProductViewModel(mockGetProductsUseCase)
    assertEquals(UiState.Loading, viewModel.uiState.value)
    // ... assertions
}
```

## Compose UI Tests
- Use `createComposeRule()` for Jetpack Compose tests
- Test user interactions with `performClick()`, `performTextInput()`
- Test accessibility with `semantics()` assertions
- Use `onNodeWithText()`, `onNodeWithContentDescription()` for finding elements

## Instrumentation Tests
- Run on emulator or physical device via `./gradlew connectedAndroidTest`
- Use Espresso for mixed Compose + XML layouts
- Test navigation flows end-to-end
