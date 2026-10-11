import javax.inject.Inject

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

/** Copies the web app in ../../app into the APK assets (served offline from assets/www). */
abstract class SyncWebApp : DefaultTask() {
    @get:InputDirectory
    abstract val source: DirectoryProperty

    @get:OutputDirectory
    abstract val outputDir: DirectoryProperty

    @get:Inject
    abstract val fs: FileSystemOperations

    @TaskAction
    fun sync() {
        fs.sync {
            from(source) { exclude("sw.js") }
            into(outputDir.dir("www"))
        }
    }
}

val syncWebApp = tasks.register<SyncWebApp>("syncWebApp") {
    source.set(rootProject.layout.projectDirectory.dir("../app"))
}

val keystorePath: String? = System.getenv("ANDROID_KEYSTORE_PATH")

// Every CI build gets a higher version code, as Google Play requires for each upload.
val buildNumber: Int = System.getenv("GITHUB_RUN_NUMBER")?.toIntOrNull() ?: 1

android {
    namespace = "in.vivekshrivastava.lawfirm"
    compileSdk = 36

    defaultConfig {
        applicationId = "in.vivekshrivastava.lawfirm"
        minSdk = 26
        targetSdk = 36
        versionCode = buildNumber
        versionName = "1.0.$buildNumber"
    }

    signingConfigs {
        if (keystorePath != null) {
            create("release") {
                storeFile = file(keystorePath)
                storePassword = System.getenv("ANDROID_KEYSTORE_PASSWORD")
                keyAlias = System.getenv("ANDROID_KEY_ALIAS")
                keyPassword = System.getenv("ANDROID_KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"))
            if (keystorePath != null) signingConfig = signingConfigs.getByName("release")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

androidComponents {
    onVariants { variant ->
        variant.sources.assets?.addGeneratedSourceDirectory(syncWebApp, SyncWebApp::outputDir)
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.activity:activity-ktx:1.9.3")
    implementation("androidx.webkit:webkit:1.12.1")
    implementation("androidx.core:core-splashscreen:1.0.1")
}
